'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface UserData {
  id: string;
  handle: string;
  name: string | null;
  analytics?: {
    current_load: number;
    delivery_rate_pct: number | null;
  };
}

interface AssignmentPickerProps {
  users: UserData[];
  name: string;
  required?: boolean;
}

export function AssignmentPicker({ users, name, required }: AssignmentPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string>('');

  const containerRef = React.useRef<HTMLDivElement>(null);

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => 
      u.handle.toLowerCase().includes(search.toLowerCase()) || 
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, search]);

  const selectedUser = users.find(u => u.id === selectedId);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label>Assignee (@handle)</Label>
      <input type="hidden" name={name} value={selectedId} required={required} />
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none transition-all focus:bg-muted/20 focus:ring-2 focus:ring-foreground",
          !selectedUser && "text-muted"
        )}
      >
        {selectedUser ? (
          <span className="font-medium">@{selectedUser.handle}</span>
        ) : (
          "Assign to..."
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-background shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
          <div className="sticky top-0 bg-background p-2">
            <input
              type="text"
              placeholder="Search people..."
              className="w-full rounded-md bg-muted/10 px-3 py-1.5 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-1">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted">No one found.</div>
            ) : (
              filteredUsers.map(user => {
                const load = user.analytics?.current_load || 0;
                const rate = user.analytics?.delivery_rate_pct;
                
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(user.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className="flex w-full flex-col items-start rounded-sm px-3 py-2 text-left hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium text-sm">@{user.handle}</span>
                      {rate !== undefined && rate !== null && (
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm",
                          rate >= 80 ? "bg-green-100 text-green-800" : rate >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                        )}>
                          {rate}% del
                        </span>
                      )}
                    </div>
                    <div className="flex w-full items-center justify-between mt-1 text-xs text-muted">
                      <span>{user.name}</span>
                      <span>{load} active task{load !== 1 ? 's' : ''}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
