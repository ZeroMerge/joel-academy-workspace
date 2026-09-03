const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createFirstAdmin() {
  console.log("Creating first admin user...");
  
  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'admin@joelos.com',
    password: 'password123',
    email_confirm: true
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log("Auth user created:", userId);

  // 2. Insert into users table
  const { error: dbError } = await supabase.from('users').insert({
    id: userId,
    email: 'admin@joelos.com',
    handle: 'admin',
    name: 'Admin User'
  });

  if (dbError) {
    console.error("DB Users Error:", dbError);
  }

  // 3. Create a default scope 'Administration' if none exists
  let scopeId;
  const { data: scopes } = await supabase.from('scopes').select('id').limit(1);
  if (!scopes || scopes.length === 0) {
    const { data: newScope } = await supabase.from('scopes').insert({
      name: 'Administration'
    }).select().single();
    scopeId = newScope.id;
  } else {
    scopeId = scopes[0].id;
  }

  // 4. Assign Admin Role
  const { error: roleError } = await supabase.from('user_role_scopes').insert({
    user_id: userId,
    base_role: 'admin',
    scope_id: scopeId
  });

  if (roleError) {
    console.error("Role Error:", roleError);
  } else {
    console.log("Admin setup complete! You can log in with admin@joelos.com / password123");
  }
}

createFirstAdmin();
