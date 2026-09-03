import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { CheckSquare, LayoutDashboard, Key, Book, Settings, ArrowRightLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { SuggestionWidget } from '@/components/home/SuggestionWidget';

export default async function HomePage() {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return null;

  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('id, title, status, deadline, scope:scopes(name)')
    .eq('assignee_id', session.user.id)
    .neq('status', 'approved')
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(5);

  let pendingRequestsCount = 0;
  if (session.canSeeRequests && session.activeScope) {
    const { count } = await supabase
      .from('cross_team_requests')
      .select('*', { count: 'exact', head: true })
      .eq('target_scope_id', session.activeScope.id)
      .eq('status', 'pending');
    pendingRequestsCount = count || 0;
  }

  // Pending exec signoffs (assuming projects table exists)
  let pendingSignoffsCount = 0;
  if (session.activeRole === 'executive' || session.activeRole === 'admin') {
    // If projects table doesn't exist yet, this might error, but we'll try safely
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

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-muted">Your active operational priorities.</p>
      </header>

      {needsAttention && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight text-red-600 dark:text-red-400">Needs Attention</h2>
          <div className="space-y-2">
            {pendingRequestsCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-none">
                <div className="flex items-center space-x-3 text-red-900 dark:text-red-200">
                  <ArrowRightLeft className="h-5 w-5" strokeWidth={1.5} />
                  <span className="font-medium text-sm">You have {pendingRequestsCount} pending cross-team requests.</span>
                </div>
                {/* Normally we'd trigger the modal from here via context, but since this is server rendered, 
                    we can just tell the user to click the icon in the header for now. */}
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Review in header</span>
              </div>
            )}
            
            {pendingSignoffsCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/10 rounded-none">
                <div className="flex items-center space-x-3 text-orange-900 dark:text-orange-200">
                  <AlertCircle className="h-5 w-5" strokeWidth={1.5} />
                  <span className="font-medium text-sm">You have {pendingSignoffsCount} projects waiting for executive sign-off.</span>
                </div>
                <Link href="/dashboard" className="text-sm font-semibold text-orange-700 dark:text-orange-400">Sign Off</Link>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Link href="/tasks" className="group flex flex-col space-y-4">
            <div className="h-10 w-10 flex items-center justify-center bg-muted/10 rounded-[12px] group-hover:bg-muted/20 transition-colors">
              <CheckSquare className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Task Board</h3>
              <p className="text-sm text-muted mt-1">Manage your active workflow.</p>
            </div>
          </Link>

          {session.canAccessVault && (
            <Link href="/resources" className="group flex flex-col space-y-4">
              <div className="h-10 w-10 flex items-center justify-center bg-muted/10 rounded-[12px] group-hover:bg-muted/20 transition-colors">
                <Key className="h-5 w-5 text-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">Access Vault</h3>
                <p className="text-sm text-muted mt-1">Request secure credentials.</p>
              </div>
            </Link>
          )}

          <Link href="/resources" className="group flex flex-col space-y-4">
            <div className="h-10 w-10 flex items-center justify-center bg-muted/10 rounded-[12px] group-hover:bg-muted/20 transition-colors">
              <Book className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">The Bible</h3>
              <p className="text-sm text-muted mt-1">Foundational rules and guides.</p>
            </div>
          </Link>

          <Link href="/profile" className="group flex flex-col space-y-4">
            <div className="h-10 w-10 flex items-center justify-center bg-muted/10 rounded-[12px] group-hover:bg-muted/20 transition-colors">
              <Settings className="h-5 w-5 text-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Availability</h3>
              <p className="text-sm text-muted mt-1">Update your team capacity.</p>
            </div>
          </Link>
        </div>
      </section>

      <div className="h-px w-full bg-divider/40" />

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Active Tasks</h2>
          <Link href="/tasks" className="text-sm text-muted hover:text-foreground font-medium">View All &rarr;</Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {!activeTasks || activeTasks.length === 0 ? (
            <div className="col-span-1 sm:col-span-2 text-sm text-muted py-4">
              You have no pending tasks.
            </div>
          ) : (
            activeTasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`} className="group flex flex-col space-y-4 bg-muted/5 hover:bg-muted/10 transition-colors p-5 rounded-none">
                <div className="h-10 w-10 flex items-center justify-center bg-blue-500/10 rounded-[12px]">
                  <LayoutDashboard className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg leading-snug">{task.title}</h3>
                  <div className="flex items-center space-x-2 mt-2 text-sm text-muted">
                    <span className="capitalize">{task.status.replace('_', ' ')}</span>
                    {task.scope && (
                      <>
                        <span>&middot;</span>
                        <span>{(task.scope as any).name}</span>
                      </>
                    )}
                    {task.deadline && (
                      <>
                        <span>&middot;</span>
                        <span className={new Date(task.deadline) < new Date() ? 'text-red-600 font-medium' : ''}>
                          {new Date(task.deadline).toLocaleDateString()}
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

      <div className="pt-8">
        <SuggestionWidget />
      </div>
    </div>
  );
}
