'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function OnboardingChecklist({ user }: { user: any }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [progress, setProgress] = React.useState(user.onboarding_progress || {
    read_guide: false,
    meet_team: false,
    join_channel: false,
    access_tools: false,
    understand_role: false,
    first_task: false
  });

  const supabase = createClient();

  // If all done, don't show
  if (Object.values(progress).every(v => v === true)) {
    return null;
  }

  if (!isOpen) return null;

  const toggleItem = async (key: string) => {
    const newProgress = { ...progress, [key]: !progress[key] };
    setProgress(newProgress);
    
    // Fire and forget update
    await supabase
      .from('users')
      .update({ onboarding_progress: newProgress })
      .eq('id', user.id);
  };

  const items = [
    { key: 'read_guide', label: 'Read Contributor Guide (SOP)' },
    { key: 'meet_team', label: 'Meet Your Team' },
    { key: 'join_channel', label: 'Join Communication Channel' },
    { key: 'access_tools', label: 'Access Required Tools (Vault)' },
    { key: 'understand_role', label: 'Understand Your Role' },
    { key: 'first_task', label: 'Complete First Task' },
  ];

  const completedCount = Object.values(progress).filter(Boolean).length;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 w-80 bg-background shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-divider bg-muted/5">
        <h3 className="font-semibold text-sm">Getting Started ({completedCount}/6)</h3>
        <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-2 space-y-1 max-h-60 overflow-auto">
        {items.map(item => (
          <label 
            key={item.key} 
            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/5 cursor-pointer transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={!!progress[item.key as keyof typeof progress]}
                onChange={() => toggleItem(item.key)}
                className="h-4 w-4 rounded border-muted/30 bg-background text-foreground focus:ring-foreground focus:ring-offset-0 transition-all cursor-pointer"
              />
            </div>
            <span className={`text-sm ${progress[item.key as keyof typeof progress] ? 'text-muted line-through' : 'text-foreground'}`}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <div className="p-3 bg-muted/5 border-t border-divider">
        <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-foreground transition-all duration-500 ease-out" 
            style={{ width: `${(completedCount / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
