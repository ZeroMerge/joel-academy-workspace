import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function AdminScopesPage() {
  const supabase = await createClient();
  
  const { data: scopes } = await supabase
    .from('scopes')
    .select(`
      id, name,
      parent:scopes(name)
    `)
    .order('name');

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Teams & Scopes</h2>
          <p className="text-sm text-muted">Manage the organizational structure and domains.</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Scope
        </Button>
      </div>

      <div className="bg-background rounded-lg overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className=" text-muted font-medium bg-muted/5">
              <th className="py-3 px-4 font-medium">Scope Name</th>
              <th className="py-3 px-4 font-medium">Parent Scope</th>
              <th className="py-3 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {scopes?.map((scope) => (
              <tr key={scope.id} className="hover:bg-muted/5 transition-colors">
                <td className="py-3 px-4 font-medium">{scope.name}</td>
                <td className="py-3 px-4 text-muted">
                  {/* @ts-ignore */}
                  {scope.parent?.name || '—'}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button variant="ghost" size="sm" className="text-xs">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
