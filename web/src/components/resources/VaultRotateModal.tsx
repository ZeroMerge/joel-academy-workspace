'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, RefreshCw } from 'lucide-react';
import { rotateVaultSecret } from '@/app/(app)/resources/actions';

interface VaultRotateModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceName: string;
  currentVersion: number;
}

export function VaultRotateModal({ isOpen, onClose, resourceId, resourceName, currentVersion }: VaultRotateModalProps) {
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    setError('');

    const res = await rotateVaultSecret(resourceId, newContent);
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setNewContent('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background p-6 rounded-2xl shadow-lg border-0 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-amber-500" />
            <div>
              <h2 className="text-base font-semibold tracking-tight">Rotate Secret: {resourceName}</h2>
              <p className="text-xs text-muted">Version {currentVersion} → Version {currentVersion + 1}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-3 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs rounded-xl space-y-1">
          <p className="font-medium">Session Invalidation Notice:</p>
          <p>Rotating this credential replaces the encrypted value in place and automatically invalidates any currently open reveal view sessions across the team.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-600 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleRotate} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="rotSecret" className="text-xs">New Secret Value</Label>
            <textarea
              id="rotSecret"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              required
              className="flex w-full rounded-md bg-muted/10 px-3 py-2 font-mono text-sm text-foreground outline-none focus:bg-muted/20 focus:ring-2 focus:ring-foreground min-h-[90px]"
              placeholder="Enter new password, token, or key..."
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Rotating...' : 'Rotate & Re-encrypt'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
