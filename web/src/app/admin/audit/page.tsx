import * as React from 'react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminAuditPage() {
  const supabase = await createClient();
  
  const { data: logs } = await supabase
    .from('audit_log')
    .select(`
      id, action, entity_type, entity_id, created_at,
      actor:users(handle)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight">Audit Log</h2>
        <p className="text-sm text-muted">Immutable record of critical actions (credential reveals, state changes).</p>
      </header>

      <div className="bg-background rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className=" text-muted font-medium bg-muted/5">
              <th className="py-3 px-4 font-medium">Timestamp</th>
              <th className="py-3 px-4 font-medium">Actor</th>
              <th className="py-3 px-4 font-medium">Action</th>
              <th className="py-3 px-4 font-medium">Entity Type</th>
              <th className="py-3 px-4 font-medium">Entity ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-muted/5 transition-colors">
                <td className="py-3 px-4 text-muted text-xs">
                  {new Date(log.created_at!).toLocaleString()}
                </td>
                <td className="py-3 px-4 font-medium">
                  {/* @ts-ignore */}
                  @{log.actor?.handle || 'system'}
                </td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center rounded-sm bg-muted/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground uppercase tracking-wider">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted">{log.entity_type}</td>
                <td className="py-3 px-4 text-muted font-mono text-xs">{log.entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
