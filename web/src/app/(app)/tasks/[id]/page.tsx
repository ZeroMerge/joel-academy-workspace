import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { TaskControls } from './TaskControls';
import { TaskMilestones } from './TaskMilestones';
import Link from 'next/link';

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  
  // Await params in next 15 if it's treated as a Promise.
  // We'll extract id normally, assuming Next 14/15 standard behavior.
  // Actually, Next 15 requires `params` to be awaited. 
  // Let's use `const { id } = await params;` just in case it's Next 15.
  // To avoid ts errors if `params` isn't a promise in our types, let's just cast.
  const resolvedParams = await (params as any);
  const taskId = resolvedParams.id;

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select(`
      *,
      assignee:users!tasks_assignee_id_fkey(id, handle, name),
      reviewer:users!tasks_reviewer_id_fkey(id, handle, name),
      creator:users!tasks_created_by_fkey(id, handle, name),
      scope:scopes(name),
      task_type:task_types(name, workflow)
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    notFound();
  }

  const { data: statusLog } = await supabase
    .from('task_status_log')
    .select(`
      id, from_status, to_status, changed_at,
      changer:users(handle)
    `)
    .eq('task_id', taskId)
    .order('changed_at', { ascending: false });
    
  const { data: milestones } = await supabase
    .from('task_milestones')
    .select('*')
    .eq('task_id', taskId)
    .order('order_index', { ascending: true });

  const workflow = (task.task_type as any)?.workflow as any;
  const validNextStatuses = workflow?.transitions?.[task.status] || [];
  
  const isAssignee = userId === (task.assignee as any)?.id;
  const isReviewer = userId === (task.reviewer as any)?.id;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <span className="inline-flex items-center rounded-full bg-muted/10 px-2 py-0.5 text-xs font-medium text-foreground">
            {task.status}
          </span>
          <span className="text-xs text-muted uppercase tracking-wider font-semibold">
            {(task.task_type as any)?.name}
          </span>
          <span className="text-xs text-muted uppercase tracking-wider font-semibold">
            • {(task.scope as any)?.name}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight">
          {task.title}
        </h1>
      </div>

      <div className="divider-b" />

      {/* Grid of properties */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Assignee</p>
          <p className="text-sm font-medium">
            {/* @ts-ignore */}
            {task.assignee ? `@${task.assignee.handle}` : 'Unassigned'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Reviewer</p>
          <p className="text-sm font-medium">
            {/* @ts-ignore */}
            {task.reviewer ? `@${task.reviewer.handle}` : 'None'}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Priority</p>
          <p className="text-sm">{task.priority || 'Medium'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted font-medium uppercase tracking-wider">Deadline</p>
          <p className="text-sm">{task.deadline || 'None'}</p>
        </div>
      </div>

      <div className="divider-b" />

      {/* Description */}
      {task.description && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-muted uppercase tracking-wider">Description</h3>
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {task.description}
          </div>
        </div>
      )}

      {/* Submission Link */}
      {task.submission_link && (
        <div className="space-y-2 bg-muted/5 p-4 rounded-lg">
          <h3 className="font-medium text-sm text-muted uppercase tracking-wider">Submission Link</h3>
          <a 
            href={task.submission_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline break-all"
          >
            {task.submission_link}
          </a>
        </div>
      )}

      <div className="divider-b pt-4" />

      <TaskMilestones 
        taskId={task.id} 
        milestones={milestones || []} 
        isAssignee={isAssignee} 
      />

      <TaskControls 
        taskId={task.id} 
        currentStatus={task.status} 
        validNextStatuses={validNextStatuses} 
        isAssignee={isAssignee}
        isReviewer={isReviewer}
      />

      <div className="divider-b pt-4" />

      {/* Status Log */}
      <div className="space-y-4">
        <h3 className="font-medium text-sm text-muted uppercase tracking-wider">History</h3>
        <div className="space-y-3">
          {statusLog?.map((log) => (
            <div key={log.id} className="flex items-start text-sm space-x-3">
              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted flex-shrink-0" />
              <div>
                <p>
                  <span className="font-medium">
                    {/* @ts-ignore */}
                    @{log.changer?.handle || 'system'}
                  </span>
                  {' changed status '}
                  {log.from_status ? `from ${log.from_status} to ` : 'to '}
                  <span className="font-medium">{log.to_status}</span>
                </p>
                <p className="text-xs text-muted">
                  {new Date(log.changed_at!).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
