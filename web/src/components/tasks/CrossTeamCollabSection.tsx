'use client';

import * as React from 'react';
import { ArrowRightLeft, Bell } from 'lucide-react';

interface ScopeItem {
  id: string;
  name: string;
}

interface CrossTeamCollabSectionProps {
  scopes: ScopeItem[];
  currentScopeId?: string | null;
}

export function CrossTeamCollabSection({ scopes, currentScopeId }: CrossTeamCollabSectionProps) {
  const [enabled, setEnabled] = React.useState(false);

  // Filter out the current team's scope so the lead cannot ping their own team
  const availableScopes = scopes.filter(s => s.id !== currentScopeId);

  if (availableScopes.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <div 
        onClick={() => setEnabled(!enabled)}
        className="flex items-center justify-between p-3.5 bg-muted/5 hover:bg-muted/10 rounded-2xl cursor-pointer transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">
              Requires another team?
            </span>
            <p className="text-xs text-muted">
              Ping another team&apos;s Lead to collaborate on this task
            </p>
          </div>
        </div>

        <input 
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded text-foreground focus:ring-0 cursor-pointer"
        />
      </div>

      {enabled && (
        <div className="p-4 bg-muted/5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="space-y-2">
            <label htmlFor="collaborating_scope_id" className="text-xs font-semibold uppercase tracking-wider text-muted">
              Select Collaborating Team
            </label>
            <select
              id="collaborating_scope_id"
              name="collaborating_scope_id"
              required={enabled}
              className="flex h-10 w-full rounded-xl bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground"
            >
              <option value="">Choose team to ping...</option>
              {availableScopes.map(scope => (
                <option key={scope.id} value={scope.id}>
                  {scope.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="cross_team_note" className="text-xs font-semibold uppercase tracking-wider text-muted">
              What is needed from their team?
            </label>
            <input
              id="cross_team_note"
              name="cross_team_note"
              type="text"
              placeholder="E.g., Need design assets for the landing page before Friday..."
              className="flex h-10 w-full rounded-xl bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-foreground"
            />
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-muted">
            <Bell className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>The Lead of the selected team will receive an in-app ping and this task will appear on their team&apos;s board.</span>
          </div>
        </div>
      )}
    </div>
  );
}
