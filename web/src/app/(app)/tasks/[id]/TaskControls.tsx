'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateTaskStatus } from '../actions';

interface TaskControlsProps {
  taskId: string;
  currentStatus: string;
  validNextStatuses: string[];
  isAssignee: boolean;
  isReviewer: boolean;
}

export function TaskControls({ taskId, currentStatus, validNextStatuses, isAssignee, isReviewer }: TaskControlsProps) {
  const [isPending, startTransition] = React.useTransition();
  const [submissionLink, setSubmissionLink] = React.useState('');

  const handleTransition = (newStatus: string, requiresLink: boolean = false) => {
    if (requiresLink && !submissionLink.trim()) {
      alert("Please provide a submission link (e.g., Google Doc, Figma) before submitting.");
      return;
    }
    
    startTransition(async () => {
      const res = await updateTaskStatus(taskId, newStatus, requiresLink ? submissionLink : undefined);
      if (res.error) {
        alert(res.error);
      }
    });
  };

  // Logic to determine which buttons to show based on role & status
  // Example: If transitioning to "Submitted", it's the assignee's job and requires a link.
  
  if (validNextStatuses.length === 0) {
    return (
      <div className="rounded-lg bg-muted/5 p-6 mt-6">
        <p className="text-sm text-muted text-center">This task has reached its final status.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-muted/5 p-6 mt-6 space-y-4">
      <h3 className="font-medium">Actions</h3>
      
      {validNextStatuses.includes('Submitted') && isAssignee && (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="submission_link">Submission Link</Label>
            <Input 
              id="submission_link" 
              placeholder="Paste Google Doc or Drive link..." 
              value={submissionLink}
              onChange={(e) => setSubmissionLink(e.target.value)}
              disabled={isPending}
            />
          </div>
          <Button 
            disabled={isPending} 
            onClick={() => handleTransition('Submitted', true)}
          >
            Submit Work
          </Button>
        </div>
      )}

      {/* For other transitions (In Progress, Approved, Revision, etc) */}
      <div className="flex flex-wrap gap-2 pt-2">
        {validNextStatuses.map(status => {
          // Skip 'Submitted' since we handled it with the input field above
          if (status === 'Submitted') return null;
          
          return (
            <Button 
              key={status} 
              variant="secondary"
              disabled={isPending} 
              onClick={() => handleTransition(status)}
            >
              Mark as {status}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
