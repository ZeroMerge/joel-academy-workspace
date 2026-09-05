import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 h-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted/30 border-t-foreground" />
      </div>
    </div>
  );
}
