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

export default async function NewTaskPage() {
  const supabase = await createClient();
  const session = await getSessionContext();

  if (!session) redirect('/login');
  if (session.activeRole === 'contributor') redirect('/tasks');

  // Check if user is lead/admin/exec to be able to create tasks
  // For v1, we can enforce in RLS/backend, but let's just fetch scopes they lead
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

  // Fetch data for dropdowns, including user analytics
  const [{ data: users }, { data: scopes }, { data: taskTypes }] = await Promise.all([
    supabase
      .from('users')
      .select('id, handle, name, analytics:user_analytics(current_load, delivery_rate_pct)')
      .eq('is_active', true),
    supabase.from('scopes').select('id, name'),
    supabase.from('task_types').select('id, name')
  ]);
  
  // Transform the one-to-one analytics relation (returns as array from Supabase by default unless .single() is used in a join, but we can just map it)
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
            <Input id="title" name="title" required placeholder="E.g., Draft Q3 Marketing Copy" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea 
              id="description" 
              name="description" 
              className="flex w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none transition-all placeholder:text-muted focus:bg-muted/20 focus:ring-2 focus:ring-foreground min-h-[100px]"
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
                className="flex h-10 w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="">Select type...</option>
                {taskTypes?.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope_id">Scope</Label>
              <select 
                id="scope_id" 
                name="scope_id" 
                required
                className="flex h-10 w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
              >
                <option value="">Select scope...</option>
                {scopes?.map(scope => (
                  <option key={scope.id} value={scope.id}>{scope.name}</option>
                ))}
              </select>
            </div>

            <AssignmentPicker name="assignee_id" users={usersWithAnalytics as any} required />
            
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" />
            </div>
          </div>
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
