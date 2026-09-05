'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
// We would use the Supabase Service Role key here to bypass RLS and create auth users
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { sendWelcomeEmail } from '@/lib/email';

export async function createPerson(data: { email: string; handle: string; name: string; baseRole: string; scopeId: string }) {
  if (!data.email || !data.handle || !data.name || !data.baseRole || !data.scopeId) {
    return { error: 'All fields (email, handle, name, role, department/scope) are strictly required.' };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) return { error: 'Not authenticated' };
  
  // Verify admin
  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('base_role')
    .eq('user_id', userData.user.id)
    .eq('base_role', 'admin');

  if (!roleScopes || roleScopes.length === 0) {
    return { error: 'Not authorized' };
  }

  // Use service role to create user in Auth
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";

  const { data: newAuthUser, error: authError } = await serviceClient.auth.admin.createUser({
    email: data.email,
    password: password,
    email_confirm: true,
  });

  if (authError || !newAuthUser.user) {
    return { error: authError?.message || 'Failed to create auth user' };
  }
  
  const { error: dbError } = await serviceClient.from('users').insert({
    id: newAuthUser.user.id,
    email: data.email,
    handle: data.handle,
    name: data.name
  });

  if (dbError) {
    await serviceClient.auth.admin.deleteUser(newAuthUser.user.id);
    return { error: dbError.message };
  }

  // Assign Role & Scope
  const { error: roleError } = await serviceClient.from('user_role_scopes').insert({
    user_id: newAuthUser.user.id,
    base_role: data.baseRole as any,
    scope_id: data.scopeId
  });

  if (roleError) {
    console.error("Failed to assign role/scope", roleError);
    // Continuing because user exists, but we should probably alert admin.
  }

  // Send the welcome email
  const emailResult = await sendWelcomeEmail(data.email, data.name, data.handle, password, data.baseRole);

  revalidatePath('/admin/people');
  return { 
    success: true, 
    tempPassword: password,
    emailSent: emailResult.success,
    emailWarning: emailResult.warning || emailResult.error
  };
}

export async function deletePerson(userId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: 'Not authenticated' };

  if (userData.user.id === userId) {
    return { error: 'You cannot delete your own admin account.' };
  }

  // Verify admin
  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('base_role')
    .eq('user_id', userData.user.id)
    .eq('base_role', 'admin');

  if (!roleScopes || roleScopes.length === 0) {
    return { error: 'Not authorized' };
  }

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Unassign open and reviewed tasks
  await serviceClient.from('tasks').update({ assignee_id: null }).eq('assignee_id', userId);
  await serviceClient.from('tasks').update({ reviewer_id: null }).eq('reviewer_id', userId);

  // 2. Unlink task_status_log
  await serviceClient.from('task_status_log').update({ changed_by: null }).eq('changed_by', userId);

  // 3. Delete vault grants and requests
  await serviceClient.from('vault_grants').delete().eq('user_id', userId);
  await serviceClient.from('vault_grants').delete().eq('granted_by', userId);
  await serviceClient.from('vault_requests').delete().eq('requested_by', userId);

  // 4. Delete user analytics & role scopes
  await serviceClient.from('user_analytics').delete().eq('user_id', userId);
  await serviceClient.from('user_role_scopes').delete().eq('user_id', userId);
  await serviceClient.from('notifications').delete().eq('user_id', userId);

  // 5. Delete from public.users table
  const { error: deleteDbError } = await serviceClient.from('users').delete().eq('id', userId);
  if (deleteDbError) {
    console.error('Failed to delete user from database:', deleteDbError);
    return { error: deleteDbError.message };
  }

  // 6. Delete permanently from Supabase Auth
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    console.error('Failed to delete user from Supabase Auth:', authDeleteError);
  }

  revalidatePath('/admin/people');
  revalidatePath('/team');
  return { success: true };
}

export async function offboardPerson(userId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: 'Not authenticated' };

  // Verify admin
  const { data: roleScopes } = await supabase
    .from('user_role_scopes')
    .select('base_role')
    .eq('user_id', userData.user.id)
    .eq('base_role', 'admin');

  if (!roleScopes || roleScopes.length === 0) {
    return { error: 'Not authorized' };
  }

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // a) Reassign open tasks to null (or flag them)
  await serviceClient.from('tasks').update({ assignee_id: null }).eq('assignee_id', userId).neq('status', 'Done');
  
  // b) Revoke all active vault_grants immediately
  await serviceClient.from('vault_grants').delete().eq('user_id', userId);
  
  // c) Remove user_role_scopes
  await serviceClient.from('user_role_scopes').delete().eq('user_id', userId);

  // Deactivate account
  await serviceClient.from('users').update({ is_active: false }).eq('id', userId);
  
  // Disable auth
  await serviceClient.auth.admin.updateUserById(userId, { ban_duration: '876000h' }); // 100 years

  revalidatePath('/admin/people');
  return { success: true };
}
