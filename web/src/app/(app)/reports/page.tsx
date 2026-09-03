import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { BarChart, ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function WeeklyReportsPage() {
  const supabase = await createClient();
  const session = await getSessionContext();
  
  if (!session) return null;
  if (!session.canSeeReports) {
    redirect('/home');
  }

  // We fetch scopes the user manages
  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('scope_id')
    .eq('user_id', session.user.id)
    .in('base_role', ['lead', 'executive', 'admin']);

  const scopeIds = roleScopes?.map(r => r.scope_id).filter(Boolean) || [];

  if (scopeIds.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        You do not manage any scopes to view reports for.
      </div>
    );
  }

  // A real weekly report would filter by the last 7 days.
  // For mockup purposes, we just pull stats for these scopes.
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, status, completed_at, scope:scopes(id, name)')
    .in('scope_id', scopeIds);

  const scopeStats = (tasks || []).reduce((acc, task) => {
    const scopeName = (task.scope as any)?.name || 'Unknown';
    if (!acc[scopeName]) acc[scopeName] = { completed: 0, active: 0 };
    if (task.completed_at) {
      acc[scopeName].completed += 1;
    } else {
      acc[scopeName].active += 1;
    }
    return acc;
  }, {} as Record<string, { completed: number; active: number }>);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <Link href="/home" className="inline-flex items-center space-x-1 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <h2 className="text-xl font-semibold tracking-tight">Weekly Output Reports</h2>
        <p className="text-sm text-muted">A macro view of completed tasks per team.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(scopeStats).map(([name, stats]) => (
          <div key={name} className="p-6 rounded-lg bg-muted/5 space-y-4">
            <h2 className="font-semibold">{name}</h2>
            <div className="grid grid-cols-2 gap-4 pt-4 ">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-medium">Completed this Week</p>
                <p className="text-2xl font-semibold mt-1 text-green-600">{stats.completed}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider font-medium">Currently Active</p>
                <p className="text-2xl font-semibold mt-1">{stats.active}</p>
              </div>
            </div>
          </div>
        ))}
        {Object.keys(scopeStats).length === 0 && (
          <div className="col-span-full p-8 text-center text-muted bg-muted/5 rounded-lg">
            No data available for your scopes.
          </div>
        )}
      </div>
    </div>
  );
}
