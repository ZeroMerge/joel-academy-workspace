'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SessionContext } from '@/lib/session';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateTaskStatus } from '@/app/(app)/tasks/actions'; // We will create this
import { Calendar } from 'lucide-react';

function SortableTaskCard({ task, session }: { task: any, session: SessionContext }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: session.activeRole === 'contributor' // Contributors cannot drag
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer group ${isDragging ? 'shadow-lg z-50 bg-background border border-divider/20' : ''}`}
      onClick={(e) => {
        // Prevent click if dragging
        if (isDragging) return;
        router.push(`/tasks/${task.id}`);
      }}
    >
      <h4 className="font-semibold text-sm leading-snug">{task.title}</h4>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium text-muted">
          {session.activeRole !== 'contributor' && task.assignee?.handle ? `@${task.assignee.handle}` : ''}
        </span>
        {task.deadline && (
          <span className={`inline-flex items-center space-x-1 font-medium text-[10px] ${isOverdue ? 'text-red-600' : 'text-muted'}`}>
            <Calendar className="h-3 w-3" strokeWidth={2} />
            <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ col, tasks, session }: { col: string, tasks: any[], session: SessionContext }) {
  const { setNodeRef } = useSortable({
    id: col,
    data: { type: 'Column' }
  });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col h-full">
      <div className="mb-3 px-1">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">{col.replace('_', ' ')} <span className="ml-1 text-xs font-normal">({tasks.length})</span></h3>
      </div>
      <div 
        ref={setNodeRef}
        className="flex-1 bg-muted/5 rounded-[12px] p-2 space-y-2 overflow-y-auto"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} session={session} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-full w-full min-h-[100px] bg-muted/5 rounded-[8px] flex items-center justify-center text-xs text-muted">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ tasks: initialTasks, columns, session }: { tasks: any[], columns: string[], session: SessionContext }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const taskToMove = tasks.find(t => t.id === activeId);
    if (!taskToMove) return;

    let newStatus = taskToMove.status;

    // Check if dropped over a column
    if (columns.includes(overId)) {
      newStatus = overId;
    } else {
      // Check if dropped over another task
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus === taskToMove.status) return;

    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === activeId ? { ...t, status: newStatus } : t));

    // Call server action
    const res = await updateTaskStatus(activeId, newStatus);
    if (res?.error) {
      // Revert and show toast
      setTasks(previousTasks);
      setErrorToast(res.error);
      setTimeout(() => setErrorToast(null), 3000);
    }
  };

  return (
    <div className="relative">
      {errorToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-[8px] shadow-lg text-sm font-medium">
          {errorToast}
        </div>
      )}
      
      <div className="flex space-x-4 overflow-x-auto pb-4 h-[calc(100vh-220px)] min-h-[400px]">
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          {columns.map(col => (
            <Column 
              key={col} 
              col={col} 
              tasks={tasks.filter(t => t.status === col)} 
              session={session} 
            />
          ))}
        </DndContext>
      </div>
    </div>
  );
}
