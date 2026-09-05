'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Copy, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { revealVaultSecret } from '@/app/(app)/resources/actions';

interface VaultRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: string;
  resourceName: string;
}

export function VaultRevealModal({ isOpen, onClose, resourceId, resourceName }: VaultRevealModalProps) {
  const [secret, setSecret] = useState<string | null>(null);
  const [version, setVersion] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isMasked, setIsMasked] = useState(true);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      setSecret(null);
      setError('');
      setIsLoading(true);
      setCountdown(60);
      return;
    }

    async function loadSecret() {
      setIsLoading(true);
      setError('');
      const res = await revealVaultSecret(resourceId);
      setIsLoading(false);

      if (res.error) {
        setError(res.error);
      } else if (res.secret) {
        setSecret(res.secret);
        setVersion(res.version || 1);
      }
    }

    loadSecret();
  }, [isOpen, resourceId]);

  // 60-second auto-close security timer
  useEffect(() => {
    if (!isOpen || !secret) return;
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, secret, onClose]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background p-6 rounded-2xl shadow-lg border-0 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <h2 className="text-base font-semibold tracking-tight">Decrypted Secret</h2>
              <p className="text-xs text-muted">{resourceName} (v{version})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted animate-pulse">
            Decrypting credentials with AES-256...
          </div>
        ) : error ? (
          <div className="p-3 bg-red-500/10 text-red-600 text-xs rounded-xl">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl bg-muted/10 p-4 font-mono text-sm break-all select-all">
              {isMasked ? '•'.repeat(Math.min(secret?.length || 12, 32)) : secret}
            </div>

            <div className="flex items-center justify-between text-xs text-muted">
              <button
                type="button"
                onClick={() => setIsMasked(!isMasked)}
                className="flex items-center space-x-1 hover:text-foreground"
              >
                {isMasked ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                <span>{isMasked ? 'Show characters' : 'Mask characters'}</span>
              </button>
              <span>Auto-closing in {countdown}s</span>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <Button type="button" variant="secondary" onClick={handleCopy}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? 'Copied' : 'Copy to Clipboard'}
              </Button>
              <Button type="button" onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
