'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, Square } from 'lucide-react';
// We'll create these server actions shortly
import { addMilestone, toggleMilestone, deleteMilestone } from '../actions';

interface Milestone {
  id: string;
  title: string;
  is_done: boolean;
  order_index: number;
}

export function TaskMilestones({ taskId, milestones, isAssignee }: { taskId: string; milestones: Milestone[]; isAssignee: boolean }) {
  const [items, setItems] = React.useState<Milestone[]>(milestones);
  const [newTitle, setNewTitle] = React.useState('');
  const [isPending, startTransition] = React.useTransition();

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const title = newTitle;
    setNewTitle('');
    
    // Optimistic UI could go here
    startTransition(async () => {
      const { data } = await addMilestone(taskId, title, items.length);
      if (data) {
        setItems(prev => [...prev, data as Milestone]);
      }
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    if (!isAssignee) return;
    
    setItems(prev => prev.map(m => m.id === id ? { ...m, is_done: !current } : m));
    
    startTransition(async () => {
      await toggleMilestone(id, !current);
    });
  };

  if (!isAssignee && items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted uppercase tracking-wider">Sub-Steps (Personal)</h3>
      
      <div className="space-y-2">
        {items.map((m) => (
          <div key={m.id} className="flex items-center space-x-3 text-sm">
            <button 
              type="button"
              disabled={!isAssignee || isPending}
              onClick={() => handleToggle(m.id, m.is_done)}
              className="text-muted hover:text-foreground focus:outline-none transition-colors"
            >
              {m.is_done ? <Check className="h-4 w-4 text-green-600" /> : <Square className="h-4 w-4" />}
            </button>
            <span className={m.is_done ? "line-through text-muted" : "text-foreground"}>
              {m.title}
            </span>
          </div>
        ))}
      </div>

      {isAssignee && (
        <div className="flex items-center space-x-2 pt-2">
          <Input 
            placeholder="Add a sub-step..." 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="h-8 text-sm"
            disabled={isPending}
          />
          <Button size="sm" variant="secondary" onClick={handleAdd} disabled={isPending || !newTitle.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
