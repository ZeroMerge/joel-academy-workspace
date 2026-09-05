import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { AddPersonForm } from './AddPersonForm';
import { DeletePersonButton } from './DeletePersonButton';

export default async function AdminPeoplePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, handle, email, name, is_active,
      roles:user_role_scopes(base_role, scope:scopes(name))
    `)
    .order('handle');

  const { data: scopes } = await supabase.from('scopes').select('id, name').order('name');

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">People</h2>
          <p className="text-sm text-muted">Manage all accounts across JOEL Academy.</p>
        </div>
        <AddPersonForm scopes={scopes || []} />
      </div>

      <div className="bg-background rounded-2xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="text-muted font-medium bg-muted/5">
              <th className="py-3 px-4 font-medium">Handle</th>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Roles & Scopes</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider/40">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-muted/5 transition-colors">
                <td className="py-3 px-4 font-medium">@{user.handle}</td>
                <td className="py-3 px-4">{user.name || '—'}</td>
                <td className="py-3 px-4 text-muted">{user.email}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.length === 0 && <span className="text-muted text-xs">No roles</span>}
                    {user.roles?.map((r, i) => (
                      <span key={i} className="inline-flex items-center rounded-md bg-muted/10 px-2 py-0.5 text-[10px] font-medium text-foreground uppercase tracking-wider">
                        {r.base_role} {(r.scope as any)?.name ? `• ${(r.scope as any).name}` : ''}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <DeletePersonButton
                    userId={user.id}
                    handle={user.handle}
                    isCurrentAdmin={userData?.user?.id === user.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}