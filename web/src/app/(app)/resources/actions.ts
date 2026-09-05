'use server';

import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { encryptSecret, decryptSecret, EncryptedPayload } from '@/lib/vaultCrypto';
import { revalidatePath } from 'next/cache';

// Helper to decode BYTEA from Postgres
function decodeBytea(raw: any): string {
  if (typeof raw === 'string') {
    if (raw.startsWith('\\x')) {
      return Buffer.from(raw.slice(2), 'hex').toString('utf8');
    }
    return raw;
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString('utf8');
  }
  return '';
}

// -------------------------------------------------------------
// 1. GROUP-SCOPED RESOURCES (LINKS)
// -------------------------------------------------------------

export async function saveGroupResource(data: {
  id?: string;
  scopeId: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  tags?: string[];
}) {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  // Permission check: Admin can manage any; Lead only in their own scope
  const isAuthorized = session.isAdmin || 
    session.roles.some(r => r.base_role === 'lead' && r.scope_id === data.scopeId);

  if (!isAuthorized) {
    return { error: 'Not authorized to manage resources for this team.' };
  }

  // Store metadata (description and tags) cleanly
  const descJson = JSON.stringify({
    summary: data.description || '',
    tags: data.tags || []
  });

  const payload = {
    scope_id: data.scopeId,
    title: data.title,
    url: data.url,
    description: descJson,
    category: data.category || 'General',
    created_by: session.user.id
  };

  let res;
  if (data.id) {
    res = await supabase.from('scope_resources').update(payload).eq('id', data.id).select().single();
  } else {
    res = await supabase.from('scope_resources').insert(payload).select().single();
  }

  if (res.error) return { error: res.error.message };
  revalidatePath('/resources');
  revalidatePath('/team');
  return { success: true, data: res.data };
}

export async function deleteGroupResource(id: string) {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  // Fetch resource to verify owning scope
  const { data: item } = await supabase.from('scope_resources').select('scope_id').eq('id', id).single();
  if (!item) return { error: 'Resource not found' };

  const isAuthorized = session.isAdmin || 
    session.roles.some(r => r.base_role === 'lead' && r.scope_id === item.scope_id);

  if (!isAuthorized) {
    return { error: 'Not authorized to delete this resource.' };
  }

  const { error } = await supabase.from('scope_resources').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/resources');
  revalidatePath('/team');
  return { success: true };
}

// -------------------------------------------------------------
// 2. REFRAMED VAULT (SECURE NOTEPAD & DRIVE FOLDERS)
// -------------------------------------------------------------

export async function createVaultEntry(data: {
  name: string;
  description?: string;
  labels?: string[];
  type: 'secret' | 'drive_folder';
  secretContent?: string;
  driveUrl?: string;
  scopeId: string;
}) {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  const isAuthorized = session.isAdmin || 
    session.roles.some(r => r.base_role === 'lead' && r.scope_id === data.scopeId);

  if (!isAuthorized) {
    return { error: 'Not authorized to create vault entries for this group.' };
  }

  const metaJson = JSON.stringify({
    summary: data.description || '',
    labels: data.labels || [],
    drive_url: data.driveUrl || '',
    version: 1
  });

  const { data: resource, error: resError } = await supabase
    .from('vault_resources')
    .insert({
      name: data.name,
      type: data.type === 'drive_folder' ? 'drive_folder' : 'other',
      owning_scope_id: data.scopeId,
      description: metaJson,
      approver_role: 'lead'
    })
    .select()
    .single();

  if (resError || !resource) {
    return { error: resError?.message || 'Failed to create vault entry.' };
  }

  // If type is secret notepad, encrypt and save content
  if (data.type === 'secret' && data.secretContent) {
    const encrypted = encryptSecret(data.secretContent, 1);
    const bufferVal = Buffer.from(JSON.stringify(encrypted), 'utf-8');

    const { error: secretError } = await supabase
      .from('vault_secrets')
      .insert({
        resource_id: resource.id,
        encrypted_value: bufferVal
      });

    if (secretError) {
      // rollback resource
      await supabase.from('vault_resources').delete().eq('id', resource.id);
      return { error: secretError.message };
    }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    actor_id: session.user.id,
    action: 'create_vault_entry',
    entity_type: 'vault_resources',
    entity_id: resource.id,
    metadata: { name: data.name, type: data.type, scope_id: data.scopeId }
  });

  revalidatePath('/resources');
  return { success: true, data: resource };
}

export async function rotateVaultSecret(resourceId: string, newSecretContent: string) {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  const { data: resource } = await supabase
    .from('vault_resources')
    .select('*, owning_scope_id')
    .eq('id', resourceId)
    .single();

  if (!resource) return { error: 'Vault entry not found' };

  const isAuthorized = session.isAdmin || 
    session.roles.some(r => r.base_role === 'lead' && r.scope_id === resource.owning_scope_id);

  if (!isAuthorized) {
    return { error: 'Not authorized to rotate this secret.' };
  }

  let meta: any = {};
  try {
    meta = JSON.parse(resource.description || '{}');
  } catch {
    meta = { summary: resource.description || '' };
  }

  const newVersion = (meta.version || 1) + 1;
  meta.version = newVersion;
  meta.rotated_at = new Date().toISOString();

  // Update resource metadata version
  await supabase
    .from('vault_resources')
    .update({ description: JSON.stringify(meta) })
    .eq('id', resourceId);

  // Encrypt and replace value in place
  const encrypted = encryptSecret(newSecretContent, newVersion);
  const bufferVal = Buffer.from(JSON.stringify(encrypted), 'utf-8');

  const { error: secretErr } = await supabase
    .from('vault_secrets')
    .upsert({
      resource_id: resourceId,
      encrypted_value: bufferVal,
      updated_at: new Date().toISOString()
    });

  if (secretErr) return { error: secretErr.message };

  // Audit log
  await supabase.from('audit_log').insert({
    actor_id: session.user.id,
    action: 'rotate_secret',
    entity_type: 'vault_resources',
    entity_id: resourceId,
    metadata: { version: newVersion }
  });

  revalidatePath('/resources');
  return { success: true, version: newVersion };
}

export async function requestVaultAccess(resourceId: string, reason?: string) {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  // Check if pending request already exists
  const { data: existing } = await supabase
    .from('vault_requests')
    .select('id, status')
    .eq('resource_id', resourceId)
    .eq('requested_by', session.user.id)
    .eq('status', 'pending')
    .single();

  if (existing) {
    return { error: 'You already have a pending request for this item.' };
  }

  const { data, error } = await supabase
    .from('vault_requests')
    .insert({
      resource_id: resourceId,
      requested_by: session.user.id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from('audit_log').insert({
    actor_id: session.user.id,
    action: 'request_vault_access',
    entity_type: 'vault_resources',
    entity_id: resourceId,
    metadata: { reason: reason || null }
  });

  revalidatePath('/resources');
  return { success: true, data };
}

export async function resolveVaultRequest(requestId: string, status: 'approved' | 'denied') {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  const { data: request } = await supabase
    .from('vault_requests')
    .select('*, resource:vault_resources(owning_scope_id, name, type, description)')
    .eq('id', requestId)
    .single();

  if (!request) return { error: 'Request not found' };

  const owningScopeId = (request.resource as any)?.owning_scope_id;
  const isAuthorized = session.isAdmin || 
    session.roles.some(r => r.base_role === 'lead' && r.scope_id === owningScopeId);

  if (!isAuthorized) {
    return { error: 'Not authorized to resolve this request.' };
  }

  const { error: updErr } = await supabase
    .from('vault_requests')
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: session.user.id
    })
    .eq('id', requestId);

  if (updErr) return { error: updErr.message };

  if (status === 'approved') {
    // 7-day manual grant
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Check if grant already exists
    const { data: grantExists } = await supabase
      .from('vault_grants')
      .select('id')
      .eq('resource_id', request.resource_id)
      .eq('user_id', request.requested_by)
      .single();

    if (grantExists) {
      await supabase
        .from('vault_grants')
        .update({
          expires_at: expiresAt,
          granted_by: session.user.id,
          last_used_at: new Date().toISOString()
        })
        .eq('id', grantExists.id);
    } else {
      await supabase
        .from('vault_grants')
        .insert({
          resource_id: request.resource_id,
          user_id: request.requested_by,
          granted_by: session.user.id,
          expires_at: expiresAt
        });
    }
  }

  await supabase.from('audit_log').insert({
    actor_id: session.user.id,
    action: status === 'approved' ? 'approve_vault_request' : 'deny_vault_request',
    entity_type: 'vault_requests',
    entity_id: requestId,
    metadata: { status, user_id: request.requested_by, resource_id: request.resource_id }
  });

  revalidatePath('/resources');
  return { success: true };
}

export async function revealVaultSecret(resourceId: string) {
  const supabase = await createClient();
  const session = await getSessionContext();
  if (!session) return { error: 'Not authenticated' };

  // 1. Check authorization:
  // Admin: always allowed
  let isGranted = session.isAdmin;
  let activeGrantId: string | null = null;

  if (!isGranted) {
    // Check manual grant
    const { data: grant } = await supabase
      .from('vault_grants')
      .select('id, expires_at')
      .eq('resource_id', resourceId)
      .eq('user_id', session.user.id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (grant) {
      isGranted = true;
      activeGrantId = grant.id;
    }
  }

  if (!isGranted) {
    // Check Task-Linked Automatic Grant (Section 7.3):
    // If the user is currently assigned to any active (not approved/done) task that has tagged this vault item
    const { data: activeTasks } = await supabase
      .from('tasks')
      .select('id, notes, status')
      .eq('assignee_id', session.user.id)
      .neq('status', 'approved');

    const hasTaskGrant = activeTasks?.some(t => {
      try {
        const meta = JSON.parse(t.notes || '{}');
        return meta.tagged_vault_ids && meta.tagged_vault_ids.includes(resourceId);
      } catch {
        return false;
      }
    });

    if (hasTaskGrant) {
      isGranted = true;
    }
  }

  if (!isGranted) {
    return { error: 'Access denied. You do not hold an active approved grant or task authorization for this secret.' };
  }

  // 2. Fetch encrypted secret
  const { data: secretRow, error: secretErr } = await supabase
    .from('vault_secrets')
    .select('encrypted_value, updated_at')
    .eq('resource_id', resourceId)
    .single();

  if (secretErr || !secretRow) {
    return { error: 'No secret content stored for this entry.' };
  }

  const rawDecoded = decodeBytea(secretRow.encrypted_value);
  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(rawDecoded);
  } catch (e) {
    return { error: 'Corrupted encrypted payload.' };
  }

  const decryptedText = decryptSecret(payload);

  // 3. Update last_used_at on grant if manual
  if (activeGrantId) {
    await supabase
      .from('vault_grants')
      .update({
        last_used_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', activeGrantId);
  }

  // 4. Audit log
  await supabase.from('audit_log').insert({
    actor_id: session.user.id,
    action: 'reveal_secret',
    entity_type: 'vault_resources',
    entity_id: resourceId,
    metadata: { version: payload.version, is_admin_override: session.isAdmin }
  });

  return {
    success: true,
    secret: decryptedText,
    version: payload.version,
    revealedAt: new Date().toISOString()
  };
}
