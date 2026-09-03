import { createClient } from '@/lib/supabase/server';

export type RoleInfo = {
  base_role: 'contributor' | 'lead' | 'executive' | 'admin';
  scope_id: string | null;
  scope_name: string | null;
};

export type SessionContext = {
  user: any | null;
  profile: any | null;
  roles: RoleInfo[];
  activeScope: { id: string; name: string } | null;
  activeRole: 'contributor' | 'lead' | 'executive' | 'admin' | null;
  isAdmin: boolean;
  isMultiScope: boolean;
  canAccessVault: boolean;
  canSeeRequests: boolean;
  canSeeCapacity: boolean;
  canSeeReports: boolean;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const { data: userData, error: authError } = await supabase.auth.getUser();
  
  if (authError || !userData?.user) {
    return null;
  }

  const userId = userData.user.id;

  const [profileRes, rolesRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('user_role_scopes').select('base_role, scope_id, scopes(name)').eq('user_id', userId)
  ]);

  const profile = profileRes.data || null;
  const rawRoles = rolesRes.data || [];

  const roles: RoleInfo[] = rawRoles.map((r: any) => ({
    base_role: r.base_role,
    scope_id: r.scope_id,
    scope_name: r.scopes?.name || null
  }));

  const isAdmin = roles.some(r => r.base_role === 'admin');
  const isMultiScope = roles.filter(r => r.scope_id !== null).length > 1;

  let activeScope = null;
  let activeRole: RoleInfo['base_role'] | null = null;

  if (profile?.active_scope_id) {
    const scopeRole = roles.find(r => r.scope_id === profile.active_scope_id);
    if (scopeRole) {
      activeScope = { id: scopeRole.scope_id!, name: scopeRole.scope_name! };
      activeRole = scopeRole.base_role;
    }
  }

  // Fallback to first available scope if active_scope_id is not set or invalid
  if (!activeScope && roles.length > 0) {
    const firstScopeRole = roles.find(r => r.scope_id !== null);
    if (firstScopeRole) {
      activeScope = { id: firstScopeRole.scope_id!, name: firstScopeRole.scope_name! };
      activeRole = firstScopeRole.base_role;
    } else if (isAdmin) {
      activeRole = 'admin'; // Pure admin
    }
  }

  const roleLevel = activeRole === 'admin' ? 4 : activeRole === 'executive' ? 3 : activeRole === 'lead' ? 2 : activeRole === 'contributor' ? 1 : 0;

  return {
    user: userData.user,
    profile,
    roles,
    activeScope,
    activeRole,
    isAdmin,
    isMultiScope,
    canAccessVault: roleLevel >= 2,
    canSeeRequests: roleLevel >= 2,
    canSeeCapacity: roleLevel >= 2,
    canSeeReports: roleLevel >= 2,
  };
}
