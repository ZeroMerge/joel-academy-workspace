const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createContributor() {
  console.log("Creating contributor user...");
  
  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'contributor@joelos.com',
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
    email: 'contributor@joelos.com',
    handle: 'contributor',
    name: 'Marketing Contributor'
  });

  if (dbError) {
    console.error("DB Users Error:", dbError);
  }

  // 3. Create a scope 'Marketing' if none exists
  let scopeId;
  const { data: scopes } = await supabase.from('scopes').select('id').eq('name', 'Marketing').limit(1);
  if (!scopes || scopes.length === 0) {
    const { data: newScope } = await supabase.from('scopes').insert({
      name: 'Marketing'
    }).select().single();
    scopeId = newScope.id;
  } else {
    scopeId = scopes[0].id;
  }

  // 4. Assign Contributor Role
  const { error: roleError } = await supabase.from('user_role_scopes').insert({
    user_id: userId,
    base_role: 'contributor',
    scope_id: scopeId
  });

  if (roleError) {
    console.error("Role Error:", roleError);
  } else {
    console.log("Contributor setup complete! You can log in with contributor@joelos.com / password123");
  }
}

createContributor();
