'use client';

import React, { useState } from 'react';
import { BookOpen, Key, Lock, FolderOpen, ExternalLink } from 'lucide-react';
import { VaultRevealModal } from '@/components/resources/VaultRevealModal';

interface TaskTaggedResourcesProps {
  resources: any[];
  vaultItems: any[];
  canAccessVault: boolean;
}

export function TaskTaggedResources({ resources, vaultItems, canAccessVault }: TaskTaggedResourcesProps) {
  const [revealModal, setRevealModal] = useState<{ id: string; name: string } | null>(null);

  if (resources.length === 0 && vaultItems.length === 0) return null;

  return (
    <div className="space-y-6 pt-2">
      {/* Informational Resources */}
      {resources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-muted" />
            <h3 className="font-medium text-xs text-muted uppercase tracking-wider">
              Attached Resources
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resources.map((res) => (
              <a
                key={res.id}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-muted/5 hover:bg-muted/10 rounded-xl transition-colors text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-medium truncate text-foreground">{res.title}</p>
                  <p className="text-[10px] text-muted">{res.category || 'General'}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Permission-Bearing Vault Entries (Section 7.3) */}
      {vaultItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Key className="h-4 w-4 text-amber-500" />
            <h3 className="font-medium text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Task-Linked Vault Access
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {vaultItems.map((v) => {
              let meta: any = {};
              try {
                meta = JSON.parse(v.description || '{}');
              } catch {}
              const isDrive = v.type === 'drive_folder';

              return (
                <div key={v.id} className="flex items-center justify-between p-3 bg-muted/5 rounded-xl text-xs gap-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    {isDrive ? (
                      <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate text-foreground">{v.name}</p>
                      <p className="text-[10px] text-muted">{isDrive ? 'Google Drive' : 'Secret Notepad'}</p>
                    </div>
                  </div>

                  {canAccessVault && (
                    isDrive && meta.drive_url ? (
                      <a
                        href={meta.drive_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 px-2.5 py-1 bg-muted/10 hover:bg-muted/20 rounded-md font-medium text-[11px] inline-flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setRevealModal({ id: v.id, name: v.name })}
                        className="shrink-0 px-2.5 py-1 bg-foreground text-background hover:bg-foreground/90 rounded-md font-medium text-[11px]"
                      >
                        View Secret
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {revealModal && (
        <VaultRevealModal
          isOpen={true}
          onClose={() => setRevealModal(null)}
          resourceId={revealModal.id}
          resourceName={revealModal.name}
        />
      )}
    </div>
  );
}