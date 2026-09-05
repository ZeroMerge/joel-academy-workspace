import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { 
  CheckSquare, 
  LayoutDashboard, 
  Key, 
  Book, 
  Settings, 
  ArrowRightLeft, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { SuggestionWidget } from '@/components/home/SuggestionWidget';

export default async function HomePage() {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return null;

  // 1. Fetch active tasks (visual anchor)
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('id, title, status, deadline, scope:scopes(name)')
    .eq('assignee_id', session.user.id)
    .neq('status', 'approved')
    .neq('status', 'Done')
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(5);

  // 2. Check completed tasks count to personalize empty state
  const { count: completedTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('assignee_id', session.user.id)
    .or('status.eq.approved,status.eq.Done');

  // 3. Needs attention checks (Lead+ & Executive)
  let pendingRequestsCount = 0;
  if (session.canSeeRequests && session.activeScope) {
    const { count } = await supabase
      .from('cross_team_requests')
      .select('*', { count: 'exact', head: true })
      .eq('target_scope_id', session.activeScope.id)
      .eq('status', 'pending');
    pendingRequestsCount = count || 0;
  }

  let pendingSignoffsCount = 0;
  if (session.activeRole === 'executive' || session.activeRole === 'admin') {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('requires_executive_signoff', true)
      .eq('signoff_status', 'pending');
    if (!error) {
      pendingSignoffsCount = count || 0;
    }
  }

  const needsAttention = pendingRequestsCount > 0 || pendingSignoffsCount > 0;
  const isAllCaughtUp = (completedTasksCount || 0) > 0;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-xs sm:text-sm text-muted">Your active operational priorities.</p>
      </header>

      {/* Needs Attention Alerts (Conditional) */}
      {needsAttention && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            Needs Attention
          </h2>
          <div className="space-y-2">
            {pendingRequestsCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-2xl">
                <div className="flex items-center space-x-3 text-red-900 dark:text-red-200">
                  <ArrowRightLeft className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  <span className="font-medium text-xs sm:text-sm">You have {pendingRequestsCount} pending cross-team request{pendingRequestsCount > 1 ? 's' : ''}.</span>
                </div>
                <Link href="/tasks?scope_filter=cross-team" className="text-xs font-semibold text-red-700 dark:text-red-400 shrink-0 hover:underline">
                  Review Tasks →
                </Link>
              </div>
            )}
            
            {pendingSignoffsCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-2xl">
                <div className="flex items-center space-x-3 text-amber-900 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                  <span className="font-medium text-xs sm:text-sm">You have {pendingSignoffsCount} project{pendingSignoffsCount > 1 ? 's' : ''} waiting for executive sign-off.</span>
                </div>
                <Link href="/dashboard" className="text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0">Sign Off</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. ACTIVE TASKS — Primary Visual Anchor                      */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Active Tasks</h2>
          <Link href="/tasks" className="text-xs text-muted hover:text-foreground font-medium flex items-center space-x-0.5">
            <span>View All</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!activeTasks || activeTasks.length === 0 ? (
            /* Context-Aware Warm Empty State */
            <div className="col-span-1 sm:col-span-2 py-10 px-6 flex flex-col items-center justify-center text-center space-y-2 bg-muted/5 rounded-2xl">
              <div className="h-10 w-10 rounded-full bg-muted/10 flex items-center justify-center mb-1">
                {isAllCaughtUp ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" strokeWidth={1.5} />
                ) : (
                  <Sparkles className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                )}
              </div>
              <h3 className="text-foreground font-semibold text-sm sm:text-base">
                {isAllCaughtUp ? "You're all caught up!" : "Nothing assigned yet"}
              </h3>
              <p className="text-xs text-muted max-w-sm">
                {isAllCaughtUp 
                  ? "You have no pending tasks right now. Great work! Feel free to explore your team resources or take a break."
                  : "Nothing assigned yet — check back soon or reach out to your Lead to get plugged in."}
              </p>
            </div>
          ) : (
            activeTasks.map((task) => (
              <Link 
                key={task.id} 
                href={`/tasks/${task.id}`} 
                className="group flex flex-col justify-between space-y-4 bg-muted/5 hover:bg-muted/10 transition-colors p-5 rounded-2xl"
              >
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted bg-muted/10 px-2 py-0.5 rounded-full">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-base leading-snug group-hover:text-foreground transition-colors">
                    {task.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2 text-xs text-muted">
                    {task.scope && (
                      <span>{(task.scope as any).name}</span>
                    )}
                    {task.deadline && (
                      <>
                        <span>&middot;</span>
                        <span className={new Date(task.deadline) < new Date() ? 'text-red-600 font-medium' : ''}>
                          Due {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. QUICK ACTIONS — Demoted Slim Horizontal Strip              */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold tracking-wider text-muted uppercase">
          Shortcuts
        </h2>
        {/* On mobile: horizontal scroll strip of icon chips without descriptions; on desktop: tight grid */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar sm:grid sm:grid-cols-4 sm:overflow-visible">
          <Link 
            href="/tasks" 
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-muted/5 hover:bg-muted/10 rounded-xl text-xs font-medium text-foreground shrink-0 transition-colors"
          >
            <CheckSquare className="h-4 w-4 text-muted shrink-0" strokeWidth={1.5} />
            <span className="whitespace-nowrap">Task Board</span>
          </Link>

          {session.canAccessVault && (
            <Link 
              href="/resources" 
              className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-muted/5 hover:bg-muted/10 rounded-xl text-xs font-medium text-foreground shrink-0 transition-colors"
            >
              <Key className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.5} />
              <span className="whitespace-nowrap">Access Vault</span>
            </Link>
          )}

          <Link 
            href="/resources" 
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-muted/5 hover:bg-muted/10 rounded-xl text-xs font-medium text-foreground shrink-0 transition-colors"
          >
            <Book className="h-4 w-4 text-muted shrink-0" strokeWidth={1.5} />
            <span className="whitespace-nowrap">Resources</span>
          </Link>

          <Link 
            href="/profile" 
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-muted/5 hover:bg-muted/10 rounded-xl text-xs font-medium text-foreground shrink-0 transition-colors"
          >
            <Settings className="h-4 w-4 text-muted shrink-0" strokeWidth={1.5} />
            <span className="whitespace-nowrap">Availability</span>
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. SUGGESTION BOX — Bottom, low-frequency, de-emphasized     */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2">
        <SuggestionWidget />
      </div>
    </div>
  );
}