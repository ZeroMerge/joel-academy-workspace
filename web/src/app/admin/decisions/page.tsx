import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function DecisionsPage() {
  const supabase = await createClient();
  
  const { data: decisions } = await supabase
    .from('decisions_log')
    .select('*, decider:users(handle), project:projects(name)')
    .order('decision_date', { ascending: false });

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Decisions Log</h2>
          <p className="text-sm text-muted">Immutable record of executive calls and major initiatives.</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Log Decision
        </Button>
      </div>

      <div className="bg-background rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className=" text-muted font-medium bg-muted/5">
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Decision</th>
              <th className="py-3 px-4 font-medium">Context</th>
              <th className="py-3 px-4 font-medium">Decider</th>
              <th className="py-3 px-4 font-medium">Project</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {!decisions || decisions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted">No decisions logged.</td>
              </tr>
            ) : (
              decisions.map((dec) => (
                <tr key={dec.id} className="hover:bg-muted/5 transition-colors">
                  <td className="py-3 px-4 font-medium">{dec.decision_date}</td>
                  <td className="py-3 px-4">{dec.title}</td>
                  <td className="py-3 px-4 text-muted whitespace-normal min-w-[200px]">{dec.context}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-sm bg-muted/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground uppercase tracking-wider">
                      {/* @ts-ignore */}
                      @{dec.decider?.handle}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {/* @ts-ignore */}
                    {dec.project?.name || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
