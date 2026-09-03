'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveResource(data: { id?: string, scope_id: string, title: string, url: string, description?: string, category?: string }) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { error: 'Not authenticated' };

  const payload = {
    scope_id: data.scope_id,
    title: data.title,
    url: data.url,
    description: data.description || null,
    category: data.category || 'General',
    created_by: userData.user.id
  };

  let result;
  if (data.id) {
    result = await supabase.from('scope_resources').update(payload).eq('id', data.id).select().single();
  } else {
    result = await supabase.from('scope_resources').insert(payload).select().single();
  }

  if (result.error) return { error: result.error.message };

  revalidatePath('/team');
  return { data: result.data };
}

export async function deleteResource(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('scope_resources').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/team');
  return { success: true };
}
