import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { ResourcesClient } from '@/components/resources/ResourcesClient';

export default async function ResourcesPage() {
  const supabase = await createClient();
  const session = await getSessionContext();

  if (!session || !session.activeScope) {
    return (
      <div className="p-8 text-center text-muted">
        Please select an active workspace group to view resources.
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 7.1: GROUP-SCOPED RESOURCES (LINKS)
  //
  // NOTE & EXPLICIT EXCEPTION:
  // Unlike Tasks or Reports elsewhere in JOEL OS, Executives are NOT automatically
  // cross-scope here. An Executive sees ONLY the Executive group's own resources,
  // not every department's resources combined. This is a deliberate, explicit
  // design exception to maintain confidential group workspaces.
  // Admins see all resources or the active scope's resources.
  // ---------------------------------------------------------------------------

  let resourcesQuery = supabase
    .from('scope_resources')
    .select('*')
    .order('created_at', { ascending: false });

  if (!session.isAdmin) {
    resourcesQuery = resourcesQuery.eq('scope_id', session.activeScope.id);
  }

  // ---------------------------------------------------------------------------
  // SECTION 7.2: ACCESS VAULT (ORG-WIDE METADATA DIRECTORY)
  //
  // Name, description, and labels are visible org-wide to everyone — people can
  // browse and know an entry exists and roughly what it is for. Secret contents
  // remain protected and encrypted at rest until authorized.
  // ---------------------------------------------------------------------------
  const vaultQuery = supabase
    .from('vault_resources')
    .select(`
      id,
      name,
      type,
      description,
      owning_scope_id,
      created_at,
      scope:scopes(name)
    `)
    .order('created_at', { ascending: false });

  // ---------------------------------------------------------------------------
  // SECTION 7.3: ACTIVE GRANTS & TASK-LINKED GRANTS
  // ---------------------------------------------------------------------------
  const grantsQuery = supabase
    .from('vault_grants')
    .select('resource_id')
    .eq('user_id', session.user.id)
    .gt('expires_at', new Date().toISOString());

  // Check active tasks assigned to user that carry automatic task-linked vault grants
  const activeTasksQuery = supabase
    .from('tasks')
    .select('notes')
    .eq('assignee_id', session.user.id)
    .neq('status', 'approved');

  // Pending vault requests for Leads/Admins
  const requestsQuery = supabase
    .from('vault_requests')
    .select(`
      id,
      resource_id,
      requested_by,
      status,
      requested_at,
      requester:users!vault_requests_requested_by_fkey(handle, name),
      resource:vault_resources(name, owning_scope_id, scope:scopes(name))
    `)
    .eq('status', 'pending');

  const scopesQuery = supabase.from('scopes').select('id, name');

  const [
    resourcesRes,
    vaultRes,
    grantsRes,
    activeTasksRes,
    requestsRes,
    scopesRes
  ] = await Promise.all([
    resourcesQuery,
    vaultQuery,
    grantsQuery,
    activeTasksQuery,
    requestsQuery,
    scopesQuery
  ]);

  // Aggregate active grant resource IDs (manual + task-linked)
  const activeGrantedIds = new Set<string>();
  grantsRes.data?.forEach(g => activeGrantedIds.add(g.resource_id));

  activeTasksRes.data?.forEach(t => {
    try {
      const meta = JSON.parse(t.notes || '{}');
      if (meta.tagged_vault_ids && Array.isArray(meta.tagged_vault_ids)) {
        meta.tagged_vault_ids.forEach((id: string) => activeGrantedIds.add(id));
      }
    } catch {}
  });

  // Filter pending requests for Leads: only show requests for their managed scopes
  const leadScopeIds = session.roles
    .filter(r => r.base_role === 'lead' || r.base_role === 'executive' || r.base_role === 'admin')
    .map(r => r.scope_id);

  const relevantRequests = (requestsRes.data || []).filter(req => {
    if (session.isAdmin) return true;
    const owningScopeId = (req.resource as any)?.owning_scope_id;
    return leadScopeIds.includes(owningScopeId);
  });

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Resources & Vault</h1>
        <p className="text-sm text-muted">
          Group documentation, tools, and organization-wide secure credential vault.
        </p>
      </header>

      <ResourcesClient
        session={session}
        activeScope={session.activeScope}
        allScopes={scopesRes.data || []}
        initialResources={resourcesRes.data || []}
        initialVaultItems={vaultRes.data || []}
        initialGrants={Array.from(activeGrantedIds)}
        initialRequests={relevantRequests}
      />
    </div>
  );
}
