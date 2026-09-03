import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message, isAnonymous } = await request.json();

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const { error } = await supabase.from('suggestions').insert({
    message,
    user_id: isAnonymous ? null : user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
