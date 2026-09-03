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

  // We need to fetch all workflow statuses from the active scope's task_types to get the columns
  // For simplicity right now, we can extract unique statuses from the tasks themselves or fetch task_types.
  // Actually, we should fetch task_types for the active scope.
  let columns: string[] = [];
  
  if (session.activeScope) {
    const { data: taskTypes } = await supabase
      .from('task_types')
      .select('workflow');
    
    // Aggregate unique columns from workflows (assuming all task types in the scope share roughly the same stages)
    const colSet = new Set<string>();
    taskTypes?.forEach(tt => {
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

  // Fetch tasks
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      priority,
      deadline,
      created_at,
      assignee:users!tasks_assignee_id_fkey(handle, avatar_url),
      scope:scopes(name)
    `)
    // If not executive/admin, we might only fetch active scope tasks.
    // If lead, fetch active scope tasks.
    // If contributor, fetch only assigned tasks.
    // The RLS policy should already handle this filtering!
    .order('created_at', { ascending: false });

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
