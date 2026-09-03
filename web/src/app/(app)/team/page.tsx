import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/session';
import { TeamWorkspaceClient } from '@/components/team/TeamWorkspaceClient';

export default async function TeamWorkspacePage() {
  const supabase = await createClient();
  const session = await getSessionContext();

  if (!session || !session.activeScope) {
    return (
      <div className="p-8 text-center text-muted">
        You are not assigned to any team scope.
      </div>
    );
  }

  // Fetch resources for this scope
  const { data: resources } = await supabase
    .from('scope_resources')
    .select('*')
    .eq('scope_id', session.activeScope.id)
    .order('category', { ascending: true })
    .order('order', { ascending: true });

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight truncate">{session.activeScope.name} Workspace</h1>
          <p className="text-sm text-muted">Curated resources, templates, and tools for your team.</p>
        </div>
      </header>

      <TeamWorkspaceClient 
        initialResources={resources || []} 
        session={session} 
      />
    </div>
  );
}
