'use client';

import * as React from 'react';
import { ArrowRightLeft, Check, X, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { respondToCrossTeamRequest } from '@/app/(app)/tasks/actions';

interface TaskCrossTeamBannerProps {
  request: {
    id: string;
    origin_scope_id: string;
    target_scope_id: string;
    status: 'pending' | 'accepted' | 'declined';
    description?: string | null;
    origin_scope?: { name: string } | null;
    target_scope?: { name: string } | null;
    requester?: { handle: string; name?: string | null } | null;
  };
  currentUserScopeId?: string | null;
  isLeadOrAdmin: boolean;
}

export function TaskCrossTeamBanner({ request, currentUserScopeId, isLeadOrAdmin }: TaskCrossTeamBannerProps) {
  const [loading, setLoading] = React.useState(false);
  const isTargetTeam = currentUserScopeId === request.target_scope_id;
  const canRespond = (isTargetTeam || isLeadOrAdmin) && request.status === 'pending';

  const handleResponse = async (status: 'accepted' | 'declined') => {
    setLoading(true);
    try {
      await respondToCrossTeamRequest(request.id, status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-muted/5 rounded-2xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Cross-Team Collaboration
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                request.status === 'accepted'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : request.status === 'declined'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}>
                {request.status}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {request.origin_scope?.name || 'Origin Team'} ↔ {request.target_scope?.name || 'Target Team'}
            </p>
          </div>
        </div>

        {canRespond && (
          <div className="flex items-center space-x-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => handleResponse('declined')}
              className="h-8 rounded-xl text-xs bg-muted/10 border-0 hover:bg-red-500/10 hover:text-red-600"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Decline
            </Button>
            <Button
              size="sm"
              disabled={loading}
              onClick={() => handleResponse('accepted')}
              className="h-8 rounded-xl text-xs bg-foreground text-background hover:bg-foreground/90"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Accept Collaboration
            </Button>
          </div>
        )}
      </div>

      {request.description && (
        <div className="text-xs text-muted pl-12">
          <span className="font-medium text-foreground">Collaboration note: </span>
          {request.description}
        </div>
      )}
    </div>
  );
}
