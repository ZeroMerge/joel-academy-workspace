'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Lock, FolderOpen } from 'lucide-react';
import { createVaultEntry } from '@/app/(app)/resources/actions';

interface VaultEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultScopeId: string;
  scopes: { id: string; name: string }[];
  isAdmin: boolean;
}

export function VaultEntryModal({ isOpen, onClose, defaultScopeId, scopes, isAdmin }: VaultEntryModalProps) {
  const [type, setType] = useState<'secret' | 'drive_folder'>('secret');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [labelsInput, setLabelsInput] = useState('');
  const [secretContent, setSecretContent] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [scopeId, setScopeId] = useState(defaultScopeId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const labels = labelsInput.split(',').map(l => l.trim()).filter(Boolean);

    const res = await createVaultEntry({
      name,
      description,
      labels,
      type,
      secretContent: type === 'secret' ? secretContent : undefined,
      driveUrl: type === 'drive_folder' ? driveUrl : undefined,
      scopeId: scopeId || defaultScopeId
    });

    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setName('');
      setDescription('');
      setLabelsInput('');
      setSecretContent('');
      setDriveUrl('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-background p-6 rounded-2xl shadow-lg border-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Add Vault Entry</h2>
            <p className="text-xs text-muted">Store a secure secret notepad or Google Drive folder.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/10 rounded-xl">
          <button
            type="button"
            onClick={() => setType('secret')}
            className={`flex items-center justify-center space-x-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              type === 'secret' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <Lock className="h-4 w-4" strokeWidth={1.5} />
            <span>Secret Notepad</span>
          </button>
          <button
            type="button"
            onClick={() => setType('drive_folder')}
            className={`flex items-center justify-center space-x-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              type === 'drive_folder' ? 'bg-background text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            <FolderOpen className="h-4 w-4" strokeWidth={1.5} />
            <span>Google Drive Folder</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-600 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="vname" className="text-xs">Name</Label>
            <Input id="vname" value={name} onChange={(e) => setName(e.target.value)} required placeholder={type === 'secret' ? 'e.g. Canva Pro Login, Stripe Test Key' : 'e.g. Marketing Assets Drive'} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="vdesc" className="text-xs">One-line Description</Label>
            <Input id="vdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this used for?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="vlabels" className="text-xs">Labels / Tags</Label>
              <Input id="vlabels" value={labelsInput} onChange={(e) => setLabelsInput(e.target.value)} placeholder="design, social, finance" />
            </div>

            {isAdmin ? (
              <div className="space-y-1">
                <Label htmlFor="vscope" className="text-xs">Owning Group</Label>
                <select
                  id="vscope"
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="flex h-10 w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
                >
                  {scopes.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">Owning Group</Label>
                <div className="h-10 px-3 flex items-center bg-muted/5 text-sm text-muted rounded-md">
                  {scopes.find(s => s.id === defaultScopeId)?.name || 'My Group'}
                </div>
              </div>
            )}
          </div>

          {type === 'secret' ? (
            <div className="space-y-1">
              <Label htmlFor="vcontent" className="text-xs">Secret Notepad Content (Encrypted at rest)</Label>
              <textarea
                id="vcontent"
                value={secretContent}
                onChange={(e) => setSecretContent(e.target.value)}
                required
                className="flex w-full rounded-md bg-muted/10 px-3 py-2 font-mono text-sm text-foreground outline-none focus:bg-muted/20 focus:ring-2 focus:ring-foreground min-h-[100px]"
                placeholder="Paste password, PIN, API key, private note, or sensitive credentials here..."
              />
              <p className="text-[11px] text-muted">
                Encrypted with AES-256-GCM. Unrevealed until explicitly requested and approved.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="gdrive" className="text-xs">Google Drive Folder URL</Label>
              <Input
                id="gdrive"
                type="url"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                required
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <p className="text-[11px] text-muted">
                Drive permissions are handled via Google. Upon approval, Leads manually grant your email and this link becomes accessible.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Entry'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}