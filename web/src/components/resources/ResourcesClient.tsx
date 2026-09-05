'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Key, 
  ExternalLink, 
  Plus, 
  Search, 
  Lock, 
  FolderOpen, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResourceFormModal } from './ResourceFormModal';
import { VaultEntryModal } from './VaultEntryModal';
import { VaultRotateModal } from './VaultRotateModal';
import { VaultRevealModal } from './VaultRevealModal';
import { SuggestionWidget } from '@/components/home/SuggestionWidget';
import { requestVaultAccess, resolveVaultRequest, deleteGroupResource } from '@/app/(app)/resources/actions';

interface ResourcesClientProps {
  session: any;
  activeScope: { id: string; name: string };
  allScopes: { id: string; name: string }[];
  initialResources: any[];
  initialVaultItems: any[];
  initialGrants: any[];
  initialRequests: any[];
}

export function ResourcesClient({
  session,
  activeScope,
  allScopes,
  initialResources,
  initialVaultItems,
  initialGrants,
  initialRequests
}: ResourcesClientProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'vault'>('resources');
  const [searchQuery, setSearchQuery] = useState('');
  const [vaultTypeFilter, setVaultTypeFilter] = useState<'all' | 'secret' | 'drive_folder'>('all');
  
  // Modals state
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [revealModalData, setRevealModalData] = useState<{ id: string; name: string } | null>(null);
  const [rotateModalData, setRotateModalData] = useState<{ id: string; name: string; version: number } | null>(null);

  const [requestingId, setRequestingId] = useState<string | null>(null);

  // Permission helpers
  const isAdmin = session.isAdmin;
  const isLead = session.roles.some((r: any) => r.base_role === 'lead' && r.scope_id === activeScope.id);
  const canManageActiveScope = isAdmin || isLead;

  // Filtered Resources
  const filteredResources = initialResources.filter(item => {
    const q = searchQuery.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(q);
    const categoryMatch = item.category?.toLowerCase().includes(q);
    let tagsMatch = false;
    try {
      const parsed = JSON.parse(item.description || '{}');
      tagsMatch = parsed.tags?.some((t: string) => t.toLowerCase().includes(q));
    } catch {}
    return titleMatch || categoryMatch || tagsMatch;
  });

  // Filtered Vault Items
  const filteredVaultItems = initialVaultItems.filter(item => {
    const q = searchQuery.toLowerCase();
    let meta: any = {};
    try {
      meta = JSON.parse(item.description || '{}');
    } catch {
      meta = { summary: item.description || '' };
    }

    const nameMatch = item.name?.toLowerCase().includes(q);
    const summaryMatch = meta.summary?.toLowerCase().includes(q);
    const labelMatch = meta.labels?.some((l: string) => l.toLowerCase().includes(q));
    const scopeMatch = (item.scope?.name || '').toLowerCase().includes(q);

    const matchesQuery = nameMatch || summaryMatch || labelMatch || scopeMatch;

    if (vaultTypeFilter === 'all') return matchesQuery;
    if (vaultTypeFilter === 'drive_folder') return matchesQuery && item.type === 'drive_folder';
    return matchesQuery && item.type !== 'drive_folder';
  });

  const handleRequestAccess = async (resourceId: string) => {
    setRequestingId(resourceId);
    await requestVaultAccess(resourceId);
    setRequestingId(null);
  };

  const handleResolveRequest = async (requestId: string, status: 'approved' | 'denied') => {
    await resolveVaultRequest(requestId, status);
  };

  const handleDeleteResource = async (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      await deleteGroupResource(id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Navigation Switcher Tabs */}
        <div className="flex p-1 bg-muted/10 rounded-[12px] space-x-1">
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-colors ${
              activeTab === 'resources' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" strokeWidth={1.5} />
            <span>{activeScope.name} Resources ({initialResources.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-[10px] transition-colors ${
              activeTab === 'vault' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <Key className="h-4 w-4" strokeWidth={1.5} />
            <span>Access Vault ({initialVaultItems.length})</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'resources' ? (
          canManageActiveScope && (
            <Button size="sm" onClick={() => { setEditingResource(null); setResourceModalOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          )
        ) : (
          (isAdmin || session.roles.some((r: any) => r.base_role === 'lead')) && (
            <Button size="sm" onClick={() => setVaultModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Vault Entry
            </Button>
          )
        )}
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'resources' ? `Search ${activeScope.name} resources or tags...` : "Search vault entries, labels, or groups..."}
            className="w-full bg-muted/5 rounded-[12px] pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:bg-muted/10 transition-colors"
          />
        </div>

        {activeTab === 'vault' && (
          <div className="flex items-center space-x-1 p-1 bg-muted/10 rounded-[10px] self-start sm:self-auto">
            <button
              onClick={() => setVaultTypeFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-[8px] transition-colors ${vaultTypeFilter === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
            >
              All
            </button>
            <button
              onClick={() => setVaultTypeFilter('secret')}
              className={`px-3 py-1 text-xs font-medium rounded-[8px] transition-colors ${vaultTypeFilter === 'secret' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
            >
              Secrets
            </button>
            <button
              onClick={() => setVaultTypeFilter('drive_folder')}
              className={`px-3 py-1 text-xs font-medium rounded-[8px] transition-colors ${vaultTypeFilter === 'drive_folder' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
            >
              Drive Folders
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7.1: GROUP-SCOPED RESOURCES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {filteredResources.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-muted/5 rounded-[12px]">
              <BookOpen className="h-8 w-8 text-muted/40" strokeWidth={1.5} />
              <span className="text-foreground font-medium">No resources found</span>
              <p className="text-xs text-muted max-w-sm">
                {searchQuery 
                  ? "Try searching for a different keyword or tag."
                  : `There are no links registered for the ${activeScope.name} group yet.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((res) => {
                let summary = res.description || '';
                let tags: string[] = [];
                try {
                  const p = JSON.parse(res.description || '{}');
                  if (p.summary !== undefined) {
                    summary = p.summary;
                    tags = p.tags || [];
                  }
                } catch {}

                let domain = '';
                try {
                  domain = new URL(res.url).hostname.replace('www.', '');
                } catch {}

                return (
                  <div key={res.id} className="p-5 bg-muted/5 hover:bg-muted/10 rounded-[14px] transition-colors flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                          {res.category || 'General'}
                        </span>
                        {domain && (
                          <span className="text-[11px] text-muted bg-muted/10 px-2 py-0.5 rounded-full">
                            {domain}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-base leading-snug">
                        {res.title}
                      </h3>

                      {summary && (
                        <p className="text-xs text-muted leading-relaxed line-clamp-2">
                          {summary}
                        </p>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tags.map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] bg-muted/10 text-muted px-2 py-0.5 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-medium text-foreground bg-muted/10 hover:bg-muted/20 px-3 py-1.5 rounded-[8px] transition-colors"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      {canManageActiveScope && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => { setEditingResource(res); setResourceModalOpen(true); }}
                            className="p-1.5 text-muted hover:text-foreground rounded-lg transition-colors cursor-pointer"
                            title="Edit resource"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(res.id)}
                            className="p-1.5 text-muted hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete resource"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 7.2: ACCESS VAULT (SECURE NOTEPAD & DRIVE FOLDERS) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Pending Requests Banner for Leads/Admins */}
          {initialRequests.length > 0 && (
            <div className="p-4 bg-muted/5 rounded-[14px] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Pending Vault Requests ({initialRequests.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {initialRequests.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-background rounded-xl gap-2 text-xs">
                    <div>
                      <span className="font-medium">@{req.requester?.handle}</span>
                      <span className="text-muted"> requested access to </span>
                      <span className="font-semibold">{req.resource?.name}</span>
                      <span className="text-[10px] text-muted ml-2">({req.resource?.scope?.name || 'Org'})</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => handleResolveRequest(req.id, 'denied')}>
                        Deny
                      </Button>
                      <Button size="sm" onClick={() => handleResolveRequest(req.id, 'approved')}>
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredVaultItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-muted/5 rounded-[12px]">
              <Key className="h-8 w-8 text-muted/40" strokeWidth={1.5} />
              <span className="text-foreground font-medium">No vault entries found</span>
              <p className="text-xs text-muted max-w-sm">
                Credentials and Google Drive folders will appear here once added by leadership.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVaultItems.map((item) => {
                let meta: any = {};
                try {
                  meta = JSON.parse(item.description || '{}');
                } catch {
                  meta = { summary: item.description || '' };
                }

                const isDriveFolder = item.type === 'drive_folder';
                const hasGrant = isAdmin || initialGrants.includes(item.id);
                const hasPending = initialRequests.some(r => r.resource_id === item.id && r.requested_by === session.user.id);
                const canManageItem = isAdmin || session.roles.some((r: any) => r.base_role === 'lead' && r.scope_id === item.owning_scope_id);

                return (
                  <div key={item.id} className="p-5 bg-muted/5 hover:bg-muted/10 rounded-[14px] transition-colors flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isDriveFolder ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {isDriveFolder ? <FolderOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          </div>
                          <span className="text-xs text-muted font-medium">
                            {item.scope?.name || 'Organization'}
                          </span>
                        </div>

                        <span className="text-[10px] font-medium bg-muted/10 text-muted px-2 py-0.5 rounded-full">
                          {isDriveFolder ? 'Google Drive' : `Secret (v${meta.version || 1})`}
                        </span>
                      </div>

                      <h3 className="font-semibold text-base leading-snug">
                        {item.name}
                      </h3>

                      {meta.summary && (
                        <p className="text-xs text-muted leading-relaxed line-clamp-2">
                          {meta.summary}
                        </p>
                      )}

                      {meta.labels && meta.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {meta.labels.map((lbl: string, i: number) => (
                            <span key={i} className="text-[10px] bg-muted/10 text-muted px-2 py-0.5 rounded-md">
                              #{lbl}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Access / Reveal Controls */}
                      {hasGrant ? (
                        isDriveFolder ? (
                          meta.drive_url ? (
                            <a
                              href={meta.drive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs font-medium text-foreground bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20 px-3 py-1.5 rounded-[8px] transition-colors"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Open Drive Folder</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-green-600 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Access Granted</span>
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => setRevealModalData({ id: item.id, name: item.name })}
                            className="inline-flex items-center space-x-1.5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Reveal Secret</span>
                          </button>
                        )
                      ) : hasPending ? (
                        <span className="inline-flex items-center space-x-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-[8px]">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Request Pending</span>
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRequestAccess(item.id)}
                          disabled={requestingId === item.id}
                        >
                          {requestingId === item.id ? 'Submitting...' : 'Request Access'}
                        </Button>
                      )}

                      {/* Lead/Admin Rotation Controls */}
                      {canManageItem && !isDriveFolder && (
                        <button
                          onClick={() => setRotateModalData({ id: item.id, name: item.name, version: meta.version || 1 })}
                          className="inline-flex items-center space-x-1 text-xs text-muted hover:text-foreground p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Rotate Secret"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Rotate</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Missing Resource / Suggestion Box Callout (Section 7.2) */}
      <div className="pt-6">
        <SuggestionWidget />
      </div>

      {/* Modals */}
      <ResourceFormModal
        isOpen={resourceModalOpen}
        onClose={() => { setResourceModalOpen(false); setEditingResource(null); }}
        scopeId={activeScope.id}
        scopeName={activeScope.name}
        initialData={editingResource}
      />

      <VaultEntryModal
        isOpen={vaultModalOpen}
        onClose={() => setVaultModalOpen(false)}
        defaultScopeId={activeScope.id}
        scopes={allScopes}
        isAdmin={isAdmin}
      />

      {rotateModalData && (
        <VaultRotateModal
          isOpen={true}
          onClose={() => setRotateModalData(null)}
          resourceId={rotateModalData.id}
          resourceName={rotateModalData.name}
          currentVersion={rotateModalData.version}
        />
      )}

      {revealModalData && (
        <VaultRevealModal
          isOpen={true}
          onClose={() => setRevealModalData(null)}
          resourceId={revealModalData.id}
          resourceName={revealModalData.name}
        />
      )}
    </div>
  );
}