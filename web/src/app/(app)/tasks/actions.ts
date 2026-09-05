'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { getSessionContext } from '@/lib/session';
import { sendNotification } from '@/lib/notifications';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export async function createTask(dataOrFormData: FormData | {
  title: string;
  description?: string;
  task_type_id: string;
  scope_id: string;
  collaborating_scope_id?: string | null;
  cross_team_note?: string | null;
  assignee_id: string;
  reviewer_id?: string;
  priority?: string;
  deadline?: string;
  tagged_resource_ids?: string[];
  tagged_vault_ids?: string[];
}) {
  const isFormData = dataOrFormData instanceof FormData;
  let data: any;
  if (isFormData) {
    const rawTaggedResources = dataOrFormData.getAll('tagged_resource_ids');
    const rawTaggedVault = dataOrFormData.getAll('tagged_vault_ids');
    data = {
      title: dataOrFormData.get('title') as string,
      description: dataOrFormData.get('description') as string,
      task_type_id: dataOrFormData.get('task_type_id') as string,
      scope_id: dataOrFormData.get('scope_id') as string,
      collaborating_scope_id: (dataOrFormData.get('collaborating_scope_id') as string) || null,
      cross_team_note: (dataOrFormData.get('cross_team_note') as string) || null,
      assignee_id: dataOrFormData.get('assignee_id') as string,
      reviewer_id: dataOrFormData.get('reviewer_id') as string,
      priority: dataOrFormData.get('priority') as string,
      deadline: dataOrFormData.get('deadline') as string,
      tagged_resource_ids: rawTaggedResources.map(String).filter(Boolean),
      tagged_vault_ids: rawTaggedVault.map(String).filter(Boolean),
    };
  } else {
    data = dataOrFormData;
  }

  const supabase = await createClient();
  const session = await getSessionContext();
  
  if (!session) {
    return { error: 'Not authenticated' };
  }
  if (session.activeRole === 'contributor') {
    return { error: 'Not authorized to create tasks' };
  }

  // 1. Get the task type to know the initial status
  const { data: taskType, error: typeError } = await supabase
    .from('task_types')
    .select('workflow')
    .eq('id', data.task_type_id)
    .single();

  if (typeError || !taskType) {
    return { error: 'Invalid task type' };
  }

  const workflow = taskType.workflow as any;
  const initialStatus = workflow?.statuses?.[0] || 'Assigned';

  // Enforce team scope for Leads
  let scopeId = data.scope_id;
  if (session.activeRole === 'lead' || (session.activeScope && !session.isAdmin)) {
    scopeId = session.activeScope?.id || scopeId;
  }

  const notesMeta = JSON.stringify({
    description: data.description || '',
    tagged_resource_ids: data.tagged_resource_ids || [],
    tagged_vault_ids: data.tagged_vault_ids || [],
    collaborating_scope_id: data.collaborating_scope_id || null,
    cross_team_note: data.cross_team_note || null,
  });

  const taskData: any = {
    title: data.title,
    description: data.description || null,
    notes: notesMeta,
    task_type_id: data.task_type_id,
    scope_id: scopeId,
    assignee_id: data.assignee_id,
    reviewer_id: data.reviewer_id || session.user.id, // defaults to creator
    created_by: session.user.id,
    priority: data.priority || 'Medium',
    status: initialStatus,
    deadline: data.deadline || null,
  };

  const { data: newTask, error: insertError } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  // Cross-Team Ping & Collaboration Infrastructure
  if (data.collaborating_scope_id) {
    try {
      // 1. Create entry in cross_team_requests
      const { data: crossReq } = await supabase
        .from('cross_team_requests')
        .insert({
          origin_scope_id: scopeId,
          target_scope_id: data.collaborating_scope_id,
          requested_by: session.user.id,
          title: data.title,
          description: data.cross_team_note || data.description || 'Cross-team task collaboration request',
          status: 'pending',
          resulting_task_id: newTask.id,
        })
        .select()
        .single();

      // 2. Query Leads of target team
      const { data: targetLeads } = await supabase
        .from('user_role_scopes')
        .select('user_id')
        .eq('scope_id', data.collaborating_scope_id)
        .eq('base_role', 'lead');

      // 3. Ping each Lead via in-app notification
      if (targetLeads && targetLeads.length > 0) {
        const teamName = session.activeScope?.name || 'A team';
        for (const lead of targetLeads) {
          await sendNotification(lead.user_id, 'cross_team_ping', {
            title: `Cross-Team Request: ${data.title}`,
            message: `${teamName} has pinged your team to collaborate on task "${data.title}".`,
            link: `/tasks/${newTask.id}`,
            task_id: newTask.id,
            origin_scope_id: scopeId,
            request_id: crossReq?.id,
          });
        }
      }
    } catch (crossErr) {
      console.error('Failed to dispatch cross-team request notification:', crossErr);
    }
  }

  // Section 7.3: Automatic Task-Linked Vault Grants
  if (data.tagged_vault_ids && data.tagged_vault_ids.length > 0 && data.assignee_id) {
    for (const vaultId of data.tagged_vault_ids) {
      // Long-term active expiration while task is active
      const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('vault_grants').upsert({
        resource_id: vaultId,
        user_id: data.assignee_id,
        granted_by: session.user.id,
        expires_at: expiresAt
      });
    }
  }

  // Log the initial status
  await supabase.from('task_status_log').insert({
    task_id: newTask.id,
    from_status: null,
    to_status: initialStatus,
    changed_by: session.user.id,
  });

  revalidatePath('/tasks');
  revalidatePath('/resources');
  revalidatePath('/home');
  if (isFormData) {
    redirect('/tasks');
  }
  return { data: newTask };
}

export async function respondToCrossTeamRequest(requestId: string, status: 'accepted' | 'declined') {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  const { data: req, error: fetchErr } = await supabase
    .from('cross_team_requests')
    .select('*, origin_scope:scopes!origin_scope_id(name)')
    .eq('id', requestId)
    .single();

  if (fetchErr || !req) return { error: 'Request not found' };

  // Only Lead or Admin of target scope can respond
  const isTargetLead = session.isAdmin || (session.activeScope?.id === req.target_scope_id && (session.activeRole === 'lead' || session.activeRole === 'executive'));
  if (!isTargetLead) {
    return { error: 'Not authorized to respond to this request' };
  }

  const { error: updateErr } = await supabase
    .from('cross_team_requests')
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: session.user.id
    })
    .eq('id', requestId);

  if (updateErr) return { error: updateErr.message };

  // Notify original requester
  if (req.requested_by) {
    await sendNotification(req.requested_by, 'cross_team_response', {
      title: `Collaboration ${status === 'accepted' ? 'Accepted' : 'Declined'}: ${req.title}`,
      message: `${session.user.name || session.user.handle || 'The Lead'} ${status} your cross-team request for "${req.title}".`,
      link: req.resulting_task_id ? `/tasks/${req.resulting_task_id}` : '/tasks',
      task_id: req.resulting_task_id,
      status
    });
  }

  revalidatePath('/tasks');
  if (req.resulting_task_id) {
    revalidatePath(`/tasks/${req.resulting_task_id}`);
  }
  revalidatePath('/home');
  return { success: true };
}

export async function updateTaskStatus(taskId: string, newStatus: string, submissionLink?: string) {
  const supabase = await createClient();
  const session = await getSessionContext();
  
  if (!session) {
    return { error: 'Not authenticated' };
  }

  // Verify transition is legal
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('status, task_type_id, assignee_id, reviewer_id')
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return { error: 'Task not found' };
  }

  const { data: taskType } = await supabase
    .from('task_types')
    .select('workflow')
    .eq('id', task.task_type_id!)
    .single();

  const workflow = taskType?.workflow as any;
  const validNextStatuses = workflow?.transitions?.[task.status] || [];

  if (!validNextStatuses.includes(newStatus)) {
    return { error: `Invalid transition from ${task.status} to ${newStatus}` };
  }

  const updates: Partial<Database['public']['Tables']['tasks']['Update']> = {
    status: newStatus,
  };

  if (submissionLink) {
    updates.submission_link = submissionLink;
    updates.submitted_at = new Date().toISOString();
  }

  // If status implies completion (e.g. Approved/Published)
  const isTerminal = !(workflow?.transitions?.[newStatus]?.length > 0) || newStatus.toLowerCase() === 'approved';
  if (isTerminal) {
    updates.completed_at = new Date().toISOString();

    // Section 7.3: Automatically revoke task-linked vault grants upon completion
    try {
      const { data: fullTask } = await supabase.from('tasks').select('notes, assignee_id').eq('id', taskId).single();
      if (fullTask?.notes && fullTask?.assignee_id) {
        const meta = JSON.parse(fullTask.notes);
        if (meta.tagged_vault_ids && Array.isArray(meta.tagged_vault_ids)) {
          for (const vaultId of meta.tagged_vault_ids) {
            // Check if user holds any other active task that tags this vault item
            const { data: otherTasks } = await supabase
              .from('tasks')
              .select('id, notes')
              .eq('assignee_id', fullTask.assignee_id)
              .neq('id', taskId)
              .neq('status', 'approved');

            const stillHeld = otherTasks?.some(ot => {
              try {
                const om = JSON.parse(ot.notes || '{}');
                return om.tagged_vault_ids?.includes(vaultId);
              } catch { return false; }
            });

            if (!stillHeld) {
              await supabase.from('vault_grants').delete()
                .eq('resource_id', vaultId)
                .eq('user_id', fullTask.assignee_id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to revoke task-linked vault grants:', err);
    }
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Log transition
  await supabase.from('task_status_log').insert({
    task_id: taskId,
    from_status: task.status,
    to_status: newStatus,
    changed_by: session.user.id,
  });

  revalidatePath('/tasks');
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

export async function addMilestone(taskId: string, title: string, order_index: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_milestones')
    .insert({ task_id: taskId, title, order_index })
    .select()
    .single();
    
  if (!error) revalidatePath(`/tasks/${taskId}`);
  return { data, error: error?.message };
}

export async function toggleMilestone(id: string, is_done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('task_milestones')
    .update({ is_done })
    .eq('id', id);
  return { error: error?.message };
}
