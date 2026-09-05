'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, CheckCircle2, AlertTriangle, Copy, Check } from 'lucide-react';
import { createPerson } from '../actions';

interface Scope {
  id: string;
  name: string;
}

interface ProvisionedUser {
  name: string;
  email: string;
  handle: string;
  tempPassword: string;
  emailSent: boolean;
  emailWarning?: string;
}

export function AddPersonForm({ scopes }: { scopes: Scope[] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [provisioned, setProvisioned] = React.useState<ProvisionedUser | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      handle: formData.get('handle') as string,
      baseRole: formData.get('base_role') as string,
      scopeId: formData.get('scope_id') as string,
    };

    startTransition(async () => {
      const result = await createPerson(data);
      if (result.error) {
        setError(result.error);
      } else {
        setProvisioned({
          name: data.name,
          email: data.email,
          handle: data.handle,
          tempPassword: result.tempPassword || '',
          emailSent: !!result.emailSent,
          emailWarning: result.emailWarning,
        });
      }
    });
  }

  const handleCopy = () => {
    if (!provisioned) return;
    const text = `Joel Academy Login\nEmail: ${provisioned.email}\nHandle: @${provisioned.handle}\nPassword: ${provisioned.tempPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setProvisioned(null);
    setError(null);
    setCopied(false);
  };

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Person
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 space-y-6">
            {!provisioned ? (
              <>
                <header>
                  <h2 className="text-xl font-semibold tracking-tight">Onboard New Team Member</h2>
                  <p className="text-xs text-muted">Provision a new account. Credentials are generated automatically.</p>
                </header>

                {error && (
                  <div className="p-3 bg-red-500/10 text-red-600 text-xs rounded-xl">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs">Full Name</Label>
                    <Input id="name" name="name" required placeholder="John Doe" disabled={isPending} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs">Email Address</Label>
                    <Input id="email" name="email" type="email" required placeholder="john@example.com" disabled={isPending} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="handle" className="text-xs">Handle (without @)</Label>
                    <Input id="handle" name="handle" required placeholder="johndoe" disabled={isPending} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="base_role" className="text-xs">System Role</Label>
                      <select 
                        id="base_role" 
                        name="base_role" 
                        required
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
                      >
                        <option value="contributor">Contributor</option>
                        <option value="lead">Lead</option>
                        <option value="executive">Executive</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="scope_id" className="text-xs">Primary Scope</Label>
                      <select 
                        id="scope_id" 
                        name="scope_id" 
                        required
                        disabled={isPending}
                        className="flex h-10 w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
                      >
                        <option value="">Select scope...</option>
                        {scopes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-2">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? 'Provisioning...' : 'Provision Account'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              /* Success / Credentials Display */
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Account Created</h2>
                    <p className="text-xs text-muted">@{provisioned.handle} provisioned successfully</p>
                  </div>
                </div>

                {/* Password card */}
                <div className="p-4 bg-muted/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Temporary Password</span>
                    <button 
                      onClick={handleCopy}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-foreground hover:underline cursor-pointer"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-base font-semibold tracking-wider text-foreground">
                    {provisioned.tempPassword}
                  </div>
                </div>

                {/* Delivery Notice */}
                {provisioned.emailSent ? (
                  <div className="p-3 bg-green-500/10 text-green-700 dark:text-green-300 text-xs rounded-xl">
                    Credentials email was dispatched via Resend to <strong>{provisioned.email}</strong>.
                  </div>
                ) : (
                  <div className="p-3 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs rounded-xl space-y-1">
                    <div className="flex items-center space-x-1 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Email Delivery Notice</span>
                    </div>
                    <p className="text-[11px] text-muted">
                      Resend could not deliver the email ({provisioned.emailWarning || 'Domain not verified on Resend'}). Please copy and send the password to the user directly.
                    </p>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={handleClose}>Done</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}