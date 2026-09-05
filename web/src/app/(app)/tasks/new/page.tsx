import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AssignmentPicker } from '@/components/ui/assignment-picker';
import { createTask } from '../actions';
import { getSessionContext } from '@/lib/session';
import { BookOpen, Key, Lock, FolderOpen } from 'lucide-react';
import { CrossTeamCollabSection } from '@/components/tasks/CrossTeamCollabSection';

export default async function NewTaskPage() {
  const supabase = await createClient();
  const session = await getSessionContext();

  if (!session) redirect('/login');
  if (session.activeRole === 'contributor') redirect('/tasks');

  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('base_role, scope_id')
    .eq('user_id', session.user.id);

  const canCreate = roleScopes?.some(r => ['admin', 'executive', 'lead'].includes(r.base_role));
  
  if (!canCreate) {
    return (
      <div className="p-8 text-center text-muted">
        You do not have permission to create tasks.
      </div>
    );
  }

  // Fetch data for dropdowns, including user analytics, resources, and vault items
  const [
    { data: users }, 
    { data: scopes }, 
    { data: taskTypes },
    { data: availableResources },
    { data: availableVaultItems }
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, handle, name, analytics:user_analytics(current_load, delivery_rate_pct)')
      .eq('is_active', true),
    supabase.from('scopes').select('id, name'),
    supabase.from('task_types').select('id, name'),
    supabase.from('scope_resources').select('id, title, category, scope_id'),
    supabase.from('vault_resources').select('id, name, type, owning_scope_id, scope:scopes(name)')
  ]);
  
  const usersWithAnalytics = (users || []).map(u => ({
    id: u.id,
    handle: u.handle,
    name: u.name,
    analytics: Array.isArray(u.analytics) ? u.analytics[0] : u.analytics
  }));

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Task</h1>
        <p className="text-sm text-muted">Assign a new task to a team member.</p>
      </header>

      <form action={createTask} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="E.g., Draft Q3 Marketing Copy" className="rounded-xl bg-muted/10 border-0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              name="description" 
              className="flex w-full rounded-xl bg-muted/10 px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:bg-muted/20 focus:ring-2 focus:ring-foreground min-h-[100px]"
              placeholder="Provide clear requirements..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_type_id">Task Type</Label>
              <select 
                id="task_type_id" 
                name="task_type_id" 
                required
                className="flex h-10 w-full rounded-xl bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="">Select type...</option>
                {taskTypes?.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            {session.activeRole === 'lead' || (session.activeScope && !session.isAdmin) ? (
              <div className="space-y-2">
                <Label>Team</Label>
                <input type="hidden" name="scope_id" value={session.activeScope?.id || ''} />
                <div className="flex h-10 w-full items-center rounded-xl bg-muted/10 px-3 py-2 text-sm font-medium text-foreground">
                  {session.activeScope?.name || 'My Team'}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="scope_id">Scope</Label>
                <select 
                  id="scope_id" 
                  name="scope_id" 
                  required
                  defaultValue={session.activeScope?.id || ''}
                  className="flex h-10 w-full rounded-xl bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
                >
                  <option value="">Select scope...</option>
                  {scopes?.map(scope => (
                    <option key={scope.id} value={scope.id}>{scope.name}</option>
                  ))}
                </select>
              </div>
            )}

            <AssignmentPicker name="assignee_id" users={usersWithAnalytics as any} required />
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" className="rounded-xl bg-muted/10 border-0" />
            </div>
          </div>

          {/* Cross-Team Collaboration & Ping */}
          <CrossTeamCollabSection scopes={scopes || []} currentScopeId={session.activeScope?.id} />

          {/* Section 7.3: Tag Resources (Informational Links) */}
          {availableResources && availableResources.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4 text-muted" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Attach Resources (Informational Links)
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-muted/5 rounded-xl">
                {availableResources.map(res => (
                  <label key={res.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/10 cursor-pointer text-xs transition-colors">
                    <input type="checkbox" name="tagged_resource_ids" value={res.id} className="rounded text-foreground focus:ring-0" />
                    <span className="font-medium truncate">{res.title}</span>
                    <span className="text-[10px] text-muted">({res.category || 'General'})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Section 7.3: Attach Vault Credentials (Permission-Bearing) */}
          {availableVaultItems && availableVaultItems.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-amber-500" />
                <Label className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Attach Vault Credentials (Automatic View Grant)
                </Label>
              </div>
              <p className="text-[11px] text-muted">
                The assignee will automatically be authorized to view these credentials while holding this task.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-muted/5 rounded-xl">
                {availableVaultItems.map(v => (
                  <label key={v.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/10 cursor-pointer text-xs transition-colors">
                    <input type="checkbox" name="tagged_vault_ids" value={v.id} className="rounded text-foreground focus:ring-0" />
                    <div className="flex items-center space-x-1.5 min-w-0">
                      {v.type === 'drive_folder' ? <FolderOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" /> : <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                      <span className="font-medium truncate">{v.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 flex justify-end space-x-3 ">
          <Link href="/tasks" className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground disabled:opacity-50 disabled:pointer-events-none bg-muted/10 text-foreground hover:bg-muted/20 h-10 px-4 py-2">
            Cancel
          </Link>
          <Button type="submit">Create Task</Button>
        </div>
      </form>
    </div>
  );
}
