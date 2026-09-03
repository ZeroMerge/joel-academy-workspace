'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateActiveScope(scopeId: string) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData?.user) return { error: 'Not authenticated' };

  // Verify the user actually has a role in this scope
  const { data: role } = await supabase
    .from('user_role_scopes')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('scope_id', scopeId)
    .single();

  if (!role) {
    return { error: 'You do not have access to this scope' };
  }

  const { error } = await supabase
    .from('users')
    .update({ active_scope_id: scopeId })
    .eq('id', userData.user.id);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { success: true };
}
