import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Users, AlertCircle, Activity } from 'lucide-react';

export default async function AdminHealthDashboard() {
  const supabase = await createClient();

  const { data: users } = await supabase.from('users').select('id, is_active, availability');
  const { data: userStats } = await supabase.from('user_stats').select('user_id, last_active_date');
  const { data: tasks } = await supabase.from('tasks').select('id, status, assignee_id, reviewer_id');

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.is_active).length || 0;
  
  // Idle: active user but no recent activity (mocking by saying no tasks assigned or last_active > 7 days)
  const idleThreshold = new Date();
  idleThreshold.setDate(idleThreshold.getDate() - 7);
  
  const idleCount = userStats?.filter(s => !s.last_active_date || new Date(s.last_active_date) < idleThreshold).length || 0;

  // Bottlenecked reviewers: count tasks in 'review' grouped by reviewer
  const reviewTasks = tasks?.filter(t => t.status === 'In Review' && t.reviewer_id) || [];
  const reviewerLoads = reviewTasks.reduce((acc, t) => {
    acc[t.reviewer_id] = (acc[t.reviewer_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const bottlenecks = Object.values(reviewerLoads).filter(count => count > 5).length; // arbitrarily > 5 is bottleneck

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Org Health</h2>
        <p className="text-sm text-muted">Pulse check on the entire volunteer organization.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-lg bg-muted/5 space-y-2">
          <div className="flex items-center space-x-2 text-muted">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Active Volunteers</span>
          </div>
          <p className="text-3xl font-semibold">{activeUsers} <span className="text-sm text-muted font-normal">/ {totalUsers} total</span></p>
        </div>

        <div className="p-6 rounded-lg bg-red-50 space-y-2">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Idle / Drifting</span>
          </div>
          <p className="text-3xl font-semibold text-red-900">{idleCount}</p>
          <p className="text-xs text-red-700">No activity in 7+ days.</p>
        </div>

        <div className="p-6 rounded-lg bg-yellow-50 space-y-2">
          <div className="flex items-center space-x-2 text-yellow-800">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Review Bottlenecks</span>
          </div>
          <p className="text-3xl font-semibold text-yellow-900">{bottlenecks}</p>
          <p className="text-xs text-yellow-700">Leads with 5+ items waiting for review.</p>
        </div>
      </div>
    </div>
  );
}
