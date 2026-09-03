'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addWeeks,
  subWeeks,
  isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { SessionContext } from '@/lib/session';

type ViewType = 'month' | 'week';

export function TaskCalendar({ tasks, session }: { tasks: any[], session: SessionContext }) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  // Map tasks to dates
  const getTasksForDate = (date: Date) => {
    return tasks.filter(t => {
      const taskDate = t.deadline ? new Date(t.deadline) : new Date(t.created_at);
      return isSameDay(taskDate, date);
    });
  };

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Generate days based on view
  let days: Date[] = [];
  if (view === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    days = eachDayOfInterval({ start: startDate, end: endDate });
  } else {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(startDate);
    days = eachDayOfInterval({ start: startDate, end: endDate });
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-background rounded-[12px] flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/5 gap-4 rounded-t-[12px]">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold min-w-[150px]">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
          </h2>
          <div className="flex items-center bg-background rounded-[8px] p-1 shadow-sm">
            <button onClick={handlePrev} className="p-1 hover:bg-muted/10 rounded-[6px] text-muted hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleToday} className="px-3 py-1 text-sm font-medium text-muted hover:text-foreground transition-colors">
              Today
            </button>
            <button onClick={handleNext} className="p-1 hover:bg-muted/10 rounded-[6px] text-muted hover:text-foreground transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center bg-background rounded-[8px] p-1 shadow-sm">
          <button 
            onClick={() => setView('month')}
            className={`px-4 py-1.5 text-sm font-medium rounded-[6px] transition-colors ${view === 'month' ? 'bg-muted/10 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            Month
          </button>
          <button 
            onClick={() => setView('week')}
            className={`px-4 py-1.5 text-sm font-medium rounded-[6px] transition-colors ${view === 'week' ? 'bg-muted/10 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-muted/5 pb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs font-semibold uppercase tracking-wider text-muted">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className={`flex-1 grid grid-cols-7 grid-rows-${view === 'month' ? (days.length / 7) : 1} gap-px bg-muted/10`}>
          {days.map((day, i) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div 
                key={day.toString()} 
                className={`min-h-[100px] bg-background p-2 transition-colors overflow-y-auto custom-scrollbar
                  ${!isCurrentMonth && view === 'month' ? 'opacity-40' : ''}
                  ${isDayToday ? 'bg-muted/5' : 'hover:bg-muted/5'}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full
                    ${isDayToday ? 'bg-foreground text-background' : 'text-muted-foreground'}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-muted bg-muted/10 px-1.5 py-0.5 rounded-[4px]">
                      {dayTasks.length}
                    </span>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  {dayTasks.map(task => {
                    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';
                    const isDone = task.status === 'approved' || task.status === 'done';
                    
                    return (
                      <div 
                        key={task.id}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        className={`px-2 py-1.5 text-xs rounded-[6px] cursor-pointer group transition-all truncate
                          ${isOverdue ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20' : 
                            isDone ? 'bg-muted/10 text-muted line-through' : 
                            'bg-muted/5 hover:bg-muted/10 text-foreground'}
                        `}
                        title={task.title}
                      >
                        <div className="font-semibold truncate">{task.title}</div>
                        {session.activeRole !== 'contributor' && task.assignee?.handle && (
                          <div className="text-[10px] opacity-70 truncate mt-0.5">@{task.assignee.handle}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--muted)/0.3); border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: hsl(var(--muted)/0.5); }
      `}} />
    </div>
  );
}
