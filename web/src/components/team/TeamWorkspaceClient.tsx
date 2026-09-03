'use client';

import React, { useState } from 'react';
import { SessionContext } from '@/lib/session';
import { Link as LinkIcon, Plus, Pencil, Trash, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteResource } from '@/app/(app)/team/actions';
import { ResourceFormModal } from './ResourceFormModal';

export function TeamWorkspaceClient({ initialResources, session }: { initialResources: any[], session: SessionContext }) {
  const [resources, setResources] = useState(initialResources);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const canEdit = session.activeRole !== 'contributor';

  // Group resources by category
  const grouped = resources.reduce((acc, r) => {
    const cat = r.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {} as Record<string, any[]>);

  const categories = Object.keys(grouped).sort();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      // Optimistic
      setResources(prev => prev.filter(r => r.id !== id));
      await deleteResource(id);
    }
  };

  const handleSaved = (savedResource: any) => {
    setResources(prev => {
      const exists = prev.find(r => r.id === savedResource.id);
      if (exists) return prev.map(r => r.id === savedResource.id ? savedResource : r);
      return [...prev, savedResource];
    });
    setIsFormOpen(false);
    setEditingResource(null);
  };

  if (resources.length === 0 && !isEditMode) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-divider/20 rounded-[12px] bg-muted/5">
        <h3 className="text-lg font-semibold mb-2">Nothing here yet</h3>
        <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
          {canEdit 
            ? 'Add your first resource link to build out the workspace.' 
            : 'Your team lead has not added any resources yet.'}
        </p>
        {canEdit && (
          <Button onClick={() => { setIsEditMode(true); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {canEdit && (
        <div className="flex items-center justify-end">
          <Button 
            variant={isEditMode ? 'primary' : 'secondary'} 
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Done Editing' : 'Manage Resources'}
          </Button>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat} className="space-y-4">
          <h2 className="text-lg font-medium text-muted">{cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {grouped[cat].map(r => (
              <div key={r.id} className="relative group bg-muted/5 hover:bg-muted/10 transition-colors p-4 rounded-none flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 flex items-center justify-center bg-blue-500/10 rounded-[12px] mb-3">
                      <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                    </div>
                    {isEditMode && (
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => { setEditingResource(r); setIsFormOpen(true); }}
                          className="p-1.5 text-muted hover:text-foreground hover:bg-background rounded-full transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold leading-snug">{r.title}</h3>
                  <p className="text-xs text-muted mt-1 truncate">
                    {r.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </p>
                  {r.description && (
                    <p className="text-sm text-muted mt-2 line-clamp-2">{r.description}</p>
                  )}
                </div>
                {!isEditMode && (
                  <a 
                    href={r.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute inset-0 z-10"
                    aria-label={`Open ${r.title}`}
                  />
                )}
              </div>
            ))}
            
            {isEditMode && (
              <button 
                onClick={() => { setEditingResource({ category: cat }); setIsFormOpen(true); }}
                className="flex flex-col items-center justify-center p-6 bg-muted/5 hover:bg-muted/10 hover:bg-muted/5 transition-all text-muted hover:text-foreground h-full min-h-[140px]"
              >
                <Plus className="h-6 w-6 mb-2" strokeWidth={1.5} />
                <span className="text-sm font-medium">Add to {cat}</span>
              </button>
            )}
          </div>
        </div>
      ))}

      {isEditMode && (
        <div className="pt-4 flex justify-center">
          <Button variant="secondary" onClick={() => { setEditingResource(null); setIsFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Category
          </Button>
        </div>
      )}

      {isFormOpen && (
        <ResourceFormModal 
          resource={editingResource} 
          scopeId={session.activeScope!.id}
          onClose={() => { setIsFormOpen(false); setEditingResource(null); }} 
          onSaved={handleSaved} 
        />
      )}
    </div>
  );
}
