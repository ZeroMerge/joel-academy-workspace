import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  // We fetch projects owned by the user or in scopes the user is a part of
  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('scope_id')
    .eq('user_id', userData.user.id);
  const scopeIds = roleScopes?.map(r => r.scope_id).filter(Boolean) || [];

  let projectsQuery = supabase
    .from('projects')
    .select('*, scope:scopes(name)')
    .order('created_at', { ascending: false });

  // If not admin/exec, filter to their scopes
  // (In a real app, RLS would do this automatically, but doing it here explicitly for the mockup)
  const isAdmin = await supabase.from('user_role_scopes').select('base_role').eq('user_id', userData.user.id).in('base_role', ['admin', 'executive']).single();
  if (!isAdmin.data && scopeIds.length > 0) {
    projectsQuery = projectsQuery.in('scope_id', scopeIds);
  } else if (!isAdmin.data) {
    projectsQuery = projectsQuery.eq('owner_id', userData.user.id); // fallback
  }

  const { data: projects } = await projectsQuery;

  const requiresApproval = projects?.filter(p => p.requires_executive_approval && !p.is_approved_by_exec) || [];
  const activeProjects = projects?.filter(p => p.status !== 'completed' && (!p.requires_executive_approval || p.is_approved_by_exec)) || [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted">Active projects and campaigns.</p>
        </div>
        <Button size="sm">New Project</Button>
      </header>

      {isAdmin.data && requiresApproval.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-red-600 flex items-center space-x-2">
            <span>Requires Executive Sign-Off</span>
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{requiresApproval.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiresApproval.map(p => (
              <div key={p.id} className="p-4 rounded-lg bg-red-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-red-900">{p.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-red-800 bg-red-200 px-1.5 py-0.5 rounded-sm">
                    {p.type}
                  </span>
                </div>
                <p className="text-xs text-red-800">Scope: {(p.scope as any)?.name}</p>
                <div className="pt-2 flex justify-end">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">Review & Approve</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="divider-b" />
      
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Active Projects & Campaigns</h2>
        {activeProjects.length === 0 ? (
          <div className="rounded-lg bg-muted/5 p-8 text-center text-sm text-muted">
            No active projects.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeProjects.map(p => (
              <div key={p.id} className="p-4 rounded-lg bg-muted/5 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{p.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted bg-muted/10 px-1.5 py-0.5 rounded-sm">
                      {p.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-1">Scope: {(p.scope as any)?.name}</p>
                </div>
                <div className="pt-4  flex items-center justify-between">
                  <span className="text-xs text-muted/70">{p.status}</span>
                  <Link href={`/projects/${p.id}`} className="text-xs font-medium hover:underline">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
