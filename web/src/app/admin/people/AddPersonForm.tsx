'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { createPerson } from '../actions';

interface Scope {
  id: string;
  name: string;
}

export function AddPersonForm({ scopes }: { scopes: Scope[] }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
        alert(result.error);
      } else {
        alert(`User created! Credentials sent to ${data.email}.`);
        setIsOpen(false);
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Person
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-background rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 space-y-6">
            <header>
              <h2 className="text-xl font-semibold tracking-tight">Onboard New Team Member</h2>
              <p className="text-sm text-muted">Provision a new account. They will receive their password via email.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required placeholder="John Doe" disabled={isPending} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required placeholder="john@example.com" disabled={isPending} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="handle">Handle (without @)</Label>
                <Input id="handle" name="handle" required placeholder="johndoe" disabled={isPending} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_role">System Role</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="scope_id">Primary Scope</Label>
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

              <div className="pt-4 flex justify-end space-x-3 ">
                <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Provisioning...' : 'Provision Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
