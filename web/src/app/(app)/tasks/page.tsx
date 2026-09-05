import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { getSessionContext } from '@/lib/session';
import { TasksView } from '@/components/tasks/TasksView';

export default async function TasksPage() {
  const supabase = await createClient();
  const session = await getSessionContext();
  
  if (!session) return null;

  let tasks: any[] = [];

  if (session.activeScope) {
    // 1. Fetch team's primary tasks
    const teamTasksPromise = supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        deadline,
        created_at,
        scope_id,
        assignee:users!tasks_assignee_id_fkey(handle, avatar_url),
        scope:scopes(name)
      `)
      .eq('scope_id', session.activeScope.id)
      .order('created_at', { ascending: false });

    // 2. Fetch cross-team requests involving this team
    const crossReqsPromise = supabase
      .from('cross_team_requests')
      .select('id, origin_scope_id, target_scope_id, status, resulting_task_id, origin_scope:scopes!origin_scope_id(name), target_scope:scopes!target_scope_id(name)')
      .or(`target_scope_id.eq.${session.activeScope.id},origin_scope_id.eq.${session.activeScope.id}`);

    const [teamTasksRes, crossReqsRes] = await Promise.all([teamTasksPromise, crossReqsPromise]);
    const teamTasks = teamTasksRes.data || [];
    const crossReqs = crossReqsRes.data || [];

    // 3. Fetch incoming tasks from other teams that pinged our team
    const incomingReqs = crossReqs.filter(r => r.target_scope_id === session.activeScope?.id && r.resulting_task_id);
    const existingTaskIds = new Set(teamTasks.map(t => t.id));
    const incomingTaskIds = incomingReqs.map(r => r.resulting_task_id).filter(id => id && !existingTaskIds.has(id));

    let incomingTasks: any[] = [];
    if (incomingTaskIds.length > 0) {
      const { data: incData } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          status,
          priority,
          deadline,
          created_at,
          scope_id,
          assignee:users!tasks_assignee_id_fkey(handle, avatar_url),
          scope:scopes(name)
        `)
        .in('id', incomingTaskIds);
      incomingTasks = incData || [];
    }

    const allRawTasks = [...teamTasks, ...incomingTasks];
    tasks = allRawTasks.map(t => {
      const req = crossReqs.find(r => r.resulting_task_id === t.id);
      if (!req) return { ...t, crossTeam: null };

      const isIncoming = req.target_scope_id === session.activeScope?.id;
      return {
        ...t,
        crossTeam: {
          isCrossTeam: true,
          direction: isIncoming ? 'incoming' : 'outgoing',
          partnerScopeName: isIncoming ? (req.origin_scope as any)?.name : (req.target_scope as any)?.name,
          requestStatus: req.status,
          requestId: req.id
        }
      };
    });
  } else {
    // Org-wide overview for Admin / Executive without active scope
    const { data: allTasks } = await supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        deadline,
        created_at,
        scope_id,
        assignee:users!tasks_assignee_id_fkey(handle, avatar_url),
        scope:scopes(name)
      `)
      .order('created_at', { ascending: false });

    const { data: allCrossReqs } = await supabase
      .from('cross_team_requests')
      .select('id, origin_scope_id, target_scope_id, status, resulting_task_id, origin_scope:scopes!origin_scope_id(name), target_scope:scopes!target_scope_id(name)');

    tasks = (allTasks || []).map(t => {
      const req = (allCrossReqs || []).find(r => r.resulting_task_id === t.id);
      if (!req) return { ...t, crossTeam: null };
      return {
        ...t,
        crossTeam: {
          isCrossTeam: true,
          direction: 'cross_team',
          partnerScopeName: `${(req.origin_scope as any)?.name || 'Origin'} → ${(req.target_scope as any)?.name || 'Target'}`,
          requestStatus: req.status,
          requestId: req.id
        }
      };
    });
  }

  const { data: taskTypes } = await (session.activeScope 
    ? supabase.from('task_types').select('workflow') 
    : Promise.resolve({ data: null, error: null }));

  let columns: string[] = [];
  if (taskTypes) {
    const colSet = new Set<string>();
    taskTypes.forEach(tt => {
      const wf = tt.workflow as any;
      if (wf && wf.statuses) {
        wf.statuses.forEach((s: string) => colSet.add(s));
      }
    });
    columns = Array.from(colSet);
  }

  // If no columns found from task_types, provide a default fallback
  if (columns.length === 0) {
    columns = ['draft', 'assigned', 'in_progress', 'in_review', 'approved'];
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight truncate">Tasks</h1>
          <p className="text-sm text-muted truncate">Manage and track work across your scoped teams.</p>
        </div>
        {session.activeRole !== 'contributor' && (
          <Link href="/tasks/new">
            <Button size="sm" className="rounded-[8px]">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        )}
      </div>

      <TasksView 
        session={session} 
        initialTasks={tasks || []} 
        columns={columns} 
      />
    </div>
  );
}
