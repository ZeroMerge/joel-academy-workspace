import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default async function ProductIdeasPage() {
  const supabase = await createClient();
  
  const { data: ideas } = await supabase
    .from('product_ideas')
    .select('*, reporter:users!product_ideas_reported_by_fkey(handle)')
    .order('created_at', { ascending: false });

  // Group by status
  const grouped = (ideas || []).reduce((acc, idea) => {
    if (!acc[idea.status]) acc[idea.status] = [];
    acc[idea.status].push(idea);
    return acc;
  }, {} as Record<string, typeof ideas>);

  const columns = [
    { id: 'idea', label: 'Ideas' },
    { id: 'validating', label: 'Validating' },
    { id: 'approved', label: 'Approved' },
    { id: 'in_progress', label: 'In Progress' }
  ];

  return (
    <div className="p-4 sm:p-8 w-full max-w-[1400px] mx-auto space-y-8">
      <header className="space-y-1 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product Pipeline</h1>
          <p className="text-sm text-muted">Ideas, validation, and roadmap.</p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Submit Idea
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {columns.map(col => (
          <div key={col.id} className="space-y-4">
            <div className="flex items-center justify-between  pb-2">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted">{col.label}</h2>
              <span className="bg-muted/10 text-muted px-2 py-0.5 rounded-full text-xs font-medium">
                {grouped[col.id]?.length || 0}
              </span>
            </div>
            
            <div className="space-y-3">
              {(grouped[col.id] || []).map(idea => (
                <div key={idea.id} className="bg-muted/5 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider bg-muted/10 text-muted px-1.5 py-0.5 rounded-sm">
                      {idea.priority || 'Medium'} Priority
                    </span>
                    <h3 className="font-medium text-sm mt-2">{idea.problem_statement}</h3>
                  </div>
                  
                  <div className="text-xs text-muted space-y-1">
                    <p><span className="font-medium">User:</span> {idea.target_user}</p>
                    <p className="line-clamp-2"><span className="font-medium">Sol:</span> {idea.proposed_solution}</p>
                  </div>
                  
                  <div className="pt-3  flex items-center justify-between text-xs text-muted">
                    <span>@{idea.reporter?.handle}</span>
                    <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
