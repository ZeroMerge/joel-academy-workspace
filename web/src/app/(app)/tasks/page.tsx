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

  const tasksPromise = supabase
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
    .order('created_at', { ascending: false });

  const taskTypesPromise = session.activeScope 
    ? supabase.from('task_types').select('workflow') 
    : Promise.resolve({ data: null, error: null });

  const [tasksRes, taskTypesRes] = await Promise.all([tasksPromise, taskTypesPromise]);

  const tasks = tasksRes.data;
  const taskTypes = taskTypesRes.data;

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
