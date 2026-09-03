import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // TODO: MUST REMOVE BEFORE PRODUCTION DEPLOYMENT
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const supabase = await createClient();
  
  // Directly sign in with the admin credentials we made
  const { error } = await supabase.auth.signInWithPassword({
    email: 'admin@joelos.com',
    password: 'password123',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Redirect to the home dashboard
  const url = new URL(request.url);
  url.pathname = '/home';
  return NextResponse.redirect(url);
}
