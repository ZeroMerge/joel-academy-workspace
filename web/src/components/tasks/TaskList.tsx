'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SessionContext } from '@/lib/session';
import { Calendar } from 'lucide-react';

export function TaskList({ tasks, session }: { tasks: any[], session: SessionContext }) {
  const router = useRouter();
  
  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center text-muted  rounded-[12px] bg-muted/5">
        <p>No tasks match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[12px]  bg-background">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-muted/5">
          <tr className=" text-muted font-medium">
            <th className="py-3 pl-4 pr-3 font-medium">Title</th>
            <th className="py-3 px-3 font-medium">Status</th>
            {(session.activeRole !== 'contributor') && (
              <th className="py-3 px-3 font-medium">Assignee</th>
            )}
            <th className="py-3 px-3 font-medium">Deadline</th>
            <th className="py-3 pl-3 pr-4 font-medium text-right">Priority</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-divider/10">
          {tasks.map((task) => {
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';
            
            return (
              <tr key={task.id} className="group hover:bg-muted/5 transition-colors cursor-pointer" onClick={() => router.push(`/tasks/${task.id}`)}>
                <td className="py-3 pl-4 pr-3">
                  <span className="font-semibold">{task.title}</span>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-muted">
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                {(session.activeRole !== 'contributor') && (
                  <td className="py-3 px-3">
                    <span className="font-medium text-muted">
                      {task.assignee?.handle ? `@${task.assignee.handle}` : 'Unassigned'}
                    </span>
                  </td>
                )}
                <td className="py-3 px-3">
                  {task.deadline ? (
                    <span className={`inline-flex items-center space-x-1 font-medium ${isOverdue ? 'text-red-600' : 'text-muted'}`}>
                      <Calendar className="h-3 w-3" strokeWidth={2} />
                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="py-3 pl-3 pr-4 text-right">
                  <span className="font-medium text-muted capitalize">{task.priority}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
