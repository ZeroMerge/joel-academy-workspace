import * as React from 'react';
import { getSessionContext } from '@/lib/session';
import { Book, Key } from 'lucide-react';

export default async function ResourcesPage() {
  const session = await getSessionContext();
  if (!session) return null;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted">Organization-wide knowledge and access.</p>
      </header>

      {/* Bible Section */}
      <section className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 flex items-center justify-center bg-blue-500/10 rounded-[12px]">
            <Book className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">The Bible</h2>
            <p className="text-sm text-muted">Org rules, culture, and SOPs.</p>
          </div>
        </div>

        <div className="bg-muted/5  p-8 rounded-[12px] text-center text-muted">
          <p>Notion cache placeholder.</p>
          <p className="text-sm mt-2">Content would be rendered here via Notion API.</p>
        </div>
      </section>

      {/* Vault Section (Role-gated) */}
      {session.canAccessVault && (
        <>
          <div className="h-px w-full bg-divider/40" />
          
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 flex items-center justify-center bg-amber-500/10 rounded-[12px]">
                <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Access Vault</h2>
                <p className="text-sm text-muted">Secure credential access.</p>
              </div>
            </div>

            <div className="bg-muted/5  p-8 rounded-[12px] text-center text-muted">
              <p>Vault UI placeholder.</p>
              <p className="text-sm mt-2">Credential request and reveal flow goes here.</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
