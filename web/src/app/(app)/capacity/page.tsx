import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { Users, ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function TeamCapacityPage() {
  const supabase = await createClient();
  const session = await getSessionContext();
  
  if (!session) return null;
  if (!session.canSeeCapacity) {
    redirect('/home');
  }

  // Scopes managed by this user
  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('scope_id')
    .eq('user_id', session.user.id)
    .in('base_role', ['lead', 'executive', 'admin']);

  const manageableScopeIds = roleScopes?.map(r => r.scope_id).filter(Boolean) || [];

  if (manageableScopeIds.length === 0) {
    return (
      <div className="p-8 text-center text-muted">
        You do not manage any teams.
      </div>
    );
  }

  // Get all users in those scopes
  const { data: teamMembers } = await supabase
    .from('user_role_scopes')
    .select('user_id, users(handle, name, availability)')
    .in('scope_id', manageableScopeIds);

  // De-duplicate users if they are in multiple scopes managed by this lead
  const uniqueUsers = new Map();
  teamMembers?.forEach(tm => {
    if (!uniqueUsers.has(tm.user_id)) {
      uniqueUsers.set(tm.user_id, tm.users);
    }
  });

  const memberIds = Array.from(uniqueUsers.keys());

  // Fetch active tasks for these users
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('assignee_id')
    .in('assignee_id', memberIds)
    .not('status', 'eq', 'Done');

  const taskCounts = (activeTasks || []).reduce((acc, t) => {
    if (t.assignee_id) acc[t.assignee_id] = (acc[t.assignee_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const membersArray = Array.from(uniqueUsers.entries()).map(([id, user]) => {
    return {
      id,
      handle: user.handle,
      name: user.name,
      availability: user.availability,
      activeTasks: taskCounts[id] || 0
    };
  }).sort((a, b) => a.activeTasks - b.activeTasks); // Sort by lightest load first

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <Link href="/home" className="inline-flex items-center space-x-1 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <h2 className="text-xl font-semibold tracking-tight">Team Capacity & Bench</h2>
        <p className="text-sm text-muted">Who has bandwidth right now?</p>
      </header>

      <div className="bg-background rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className=" text-muted font-medium bg-muted/5">
              <th className="py-3 px-4 font-medium">Contributor</th>
              <th className="py-3 px-4 font-medium">Availability</th>
              <th className="py-3 px-4 font-medium">Active Tasks (Load)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {membersArray.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted">No team members found.</td>
              </tr>
            ) : (
              membersArray.map((m) => (
                <tr key={m.id} className={`hover:bg-muted/5 transition-colors ${m.availability === 'unavailable' ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted">@{m.handle}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      m.availability === 'available' ? 'bg-green-100 text-green-800' :
                      m.availability === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {m.availability}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{m.activeTasks}</span>
                      <span className="text-xs text-muted">tasks assigned</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
