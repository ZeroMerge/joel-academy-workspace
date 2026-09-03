'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { saveResource } from '@/app/(app)/team/actions';

export function ResourceFormModal({ resource, scopeId, onClose, onSaved }: { resource?: any, scopeId: string, onClose: () => void, onSaved: (r: any) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      id: resource?.id,
      scope_id: scopeId,
      title: formData.get('title') as string,
      url: formData.get('url') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
    };

    const res = await saveResource(data);
    
    if (res.error) {
      setError(res.error);
      setIsSubmitting(false);
    } else {
      onSaved(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-none shadow-2xl  w-full max-w-md flex flex-col overflow-hidden">
        <div className="p-4  flex items-center justify-between">
          <h2 className="font-semibold">{resource?.id ? 'Edit Resource' : 'Add Resource'}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm">{error}</div>}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input 
              name="title"
              defaultValue={resource?.title}
              className="w-full p-2 bg-muted/5 border border-divider/50 focus:outline-none focus:ring-1 focus:ring-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <input 
              name="url"
              type="url"
              defaultValue={resource?.url}
              className="w-full p-2 bg-muted/5 border border-divider/50 focus:outline-none focus:ring-1 focus:ring-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <input 
              name="description"
              defaultValue={resource?.description}
              className="w-full p-2 bg-muted/5 border border-divider/50 focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <input 
              name="category"
              defaultValue={resource?.category || 'General'}
              className="w-full p-2 bg-muted/5 border border-divider/50 focus:outline-none focus:ring-1 focus:ring-foreground"
              placeholder="e.g. Tools, Templates"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
