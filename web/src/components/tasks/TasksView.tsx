'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { List, LayoutDashboard, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { SessionContext } from '@/lib/session';
import { TaskBoard } from './TaskBoard';
import { TaskList } from './TaskList';
import { TaskCalendar } from './TaskCalendar';

type ViewMode = 'list' | 'board' | 'calendar';

export function TasksView({ session, initialTasks, columns }: { session: SessionContext, initialTasks: any[], columns: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [view, setView] = useState<ViewMode>(() => {
    // 1. URL
    const urlView = searchParams.get('view') as ViewMode;
    if (urlView && ['list', 'board', 'calendar'].includes(urlView)) return urlView;
    // 2. Local storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('joel_tasks_view') as ViewMode;
      if (saved && ['list', 'board', 'calendar'].includes(saved)) return saved;
    }
    // 3. Default based on role
    return session.activeRole === 'contributor' ? 'list' : 'board';
  });

  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(searchParams.get('assignee'));
  const [statusFilter, setStatusFilter] = useState<string | null>(searchParams.get('status'));
  const [scopeFilter, setScopeFilter] = useState<string | null>(searchParams.get('scope_filter'));

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('joel_tasks_view', view);
    }
  }, [view]);

  // Sync filters to URL
  const updateUrl = (newView: ViewMode, newAssignee: string | null, newStatus: string | null, newScopeFilter: string | null) => {
    const params = new URLSearchParams();
    if (newView) params.set('view', newView);
    if (newAssignee) params.set('assignee', newAssignee);
    if (newStatus) params.set('status', newStatus);
    if (newScopeFilter) params.set('scope_filter', newScopeFilter);
    router.replace(`/tasks?${params.toString()}`);
  };

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    updateUrl(v, assigneeFilter, statusFilter, scopeFilter);
  };

  // Filter tasks
  const filteredTasks = initialTasks.filter(t => {
    if (assigneeFilter && t.assignee?.handle !== assigneeFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (scopeFilter === 'team' && t.crossTeam) return false;
    if (scopeFilter === 'cross-team' && !t.crossTeam) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* View Toggle */}
        <div className="inline-flex items-center p-1 bg-muted/5 rounded-[12px] ">
          <button 
            onClick={() => handleViewChange('list')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <List className="h-4 w-4" strokeWidth={1.5} />
            <span>List</span>
          </button>
          <button 
            onClick={() => handleViewChange('board')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${view === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
            <span>Board</span>
          </button>
          <button 
            onClick={() => handleViewChange('calendar')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <CalendarIcon className="h-4 w-4" strokeWidth={1.5} />
            <span>Calendar</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          {(session.activeRole === 'lead' || session.activeRole === 'executive' || session.isAdmin) && (
            <select 
              className="text-sm bg-muted/5  rounded-[12px] px-3 py-2 outline-none focus:ring-1 focus:ring-foreground"
              value={assigneeFilter || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setAssigneeFilter(val);
                updateUrl(view, val, statusFilter, scopeFilter);
              }}
            >
              <option value="">All Assignees</option>
              {Array.from(new Set(initialTasks.map(t => t.assignee?.handle).filter(Boolean))).map(handle => (
                <option key={handle} value={handle as string}>@{handle}</option>
              ))}
            </select>
          )}

          {session.activeScope && (
            <select
              className="text-sm bg-muted/5 rounded-[12px] px-3 py-2 outline-none focus:ring-1 focus:ring-foreground"
              value={scopeFilter || ''}
              onChange={(e) => {
                const val = e.target.value || null;
                setScopeFilter(val);
                updateUrl(view, assigneeFilter, statusFilter, val);
              }}
            >
              <option value="">All Tasks</option>
              <option value="team">Team Only</option>
              <option value="cross-team">Cross-Team Only</option>
            </select>
          )}

          <select 
            className="text-sm bg-muted/5  rounded-[12px] px-3 py-2 outline-none focus:ring-1 focus:ring-foreground"
            value={statusFilter || ''}
            onChange={(e) => {
              const val = e.target.value || null;
              setStatusFilter(val);
              updateUrl(view, assigneeFilter, val, scopeFilter);
            }}
          >
            <option value="">All Statuses</option>
            {columns.map(col => (
              <option key={col} value={col}>{col.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Render selected view */}
      <div className="pt-2">
        {view === 'list' && <TaskList tasks={filteredTasks} session={session} />}
        {view === 'board' && <TaskBoard tasks={filteredTasks} columns={columns} session={session} />}
        {view === 'calendar' && <TaskCalendar tasks={filteredTasks} session={session} />}
      </div>
    </div>
  );
}
