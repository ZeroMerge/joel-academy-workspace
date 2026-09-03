'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';
import { getSessionContext } from '@/lib/session';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

export async function createTask(data: {
  title: string;
  description?: string;
  task_type_id: string;
  scope_id: string;
  assignee_id: string;
  reviewer_id?: string;
  priority?: string;
  deadline?: string;
}) {
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

  const taskData: TaskInsert = {
    title: data.title,
    description: data.description || null,
    task_type_id: data.task_type_id,
    scope_id: data.scope_id,
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

  // Log the initial status
  await supabase.from('task_status_log').insert({
    task_id: newTask.id,
    from_status: null,
    to_status: initialStatus,
    changed_by: session.user.id,
  });

  revalidatePath('/tasks');
  return { data: newTask };
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

  // If status implies completion (e.g. Approved/Published - let's say 'Approved' for now)
  // We'll need a way in workflow JSON to denote terminal statuses. 
  // Let's assume if there are no next transitions, it's terminal.
  const isTerminal = !(workflow?.transitions?.[newStatus]?.length > 0);
  if (isTerminal) {
    updates.completed_at = new Date().toISOString();
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
