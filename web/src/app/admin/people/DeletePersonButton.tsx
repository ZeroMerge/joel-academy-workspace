'use client';

import * as React from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deletePerson } from '../actions';

interface DeletePersonButtonProps {
  userId: string;
  handle: string;
  isCurrentAdmin: boolean;
}

export function DeletePersonButton({ userId, handle, isCurrentAdmin }: DeletePersonButtonProps) {
  const [isDeleting, startTransition] = React.useTransition();

  if (isCurrentAdmin) {
    return (
      <span className="text-xs text-muted italic px-2 py-1">
        Current user
      </span>
    );
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete @${handle}?\n\nThis will remove their account, auth login, role scopes, and unassign all tasks.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deletePerson(userId);
      if (res.error) {
        alert(`Error deleting user: ${res.error}`);
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center space-x-1 p-1.5 text-muted hover:text-red-600 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer text-xs"
      title={`Delete @${handle}`}
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Delete</span>
    </button>
  );
}