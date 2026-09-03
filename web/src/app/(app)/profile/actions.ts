'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const name = formData.get('name') as string;
  const availability = formData.get('availability') as string;
  const returnDate = formData.get('return_date') as string;

  const updates: any = {};
  if (name) updates.name = name;
  if (availability) updates.availability = availability;
  if (returnDate) updates.availability_return_date = returnDate;
  else if (availability !== 'unavailable') updates.availability_return_date = null; // Clear if not unavailable

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { error: 'Failed to update profile' };
  }

  revalidatePath('/profile');
  revalidatePath('/team'); // refresh team capacity views
  return { success: true };
}
