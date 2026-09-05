'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { saveGroupResource } from '@/app/(app)/resources/actions';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  scopeId: string;
  scopeName: string;
  initialData?: any;
}

export function ResourceFormModal({ isOpen, onClose, scopeId, scopeName, initialData }: ResourceFormModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setUrl(initialData.url || '');
      setCategory(initialData.category || 'General');
      
      let summary = initialData.description || '';
      let tags: string[] = [];
      try {
        const parsed = JSON.parse(initialData.description || '{}');
        if (parsed.summary !== undefined) {
          summary = parsed.summary;
          tags = parsed.tags || [];
        }
      } catch {}
      
      setDescription(summary);
      setTagsInput(tags.join(', '));
    } else {
      setTitle('');
      setUrl('');
      setDescription('');
      setCategory('General');
      setTagsInput('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const res = await saveGroupResource({
      id: initialData?.id,
      scopeId,
      title,
      url,
      description,
      category,
      tags
    });

    setIsSubmitting(false);
    if (res.error) {
      setError(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-background p-6 rounded-2xl shadow-lg border-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {initialData ? 'Edit Resource' : 'New Resource'}
            </h2>
            <p className="text-xs text-muted">Group: {scopeName}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 text-red-600 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Brand Guidelines Figma" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="url" className="text-xs">URL</Label>
            <Input id="url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="category" className="text-xs">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Design, Guidelines" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tags" className="text-xs">Tags (comma-separated)</Label>
              <Input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="figma, brand, assets" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="desc" className="text-xs">Description</Label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-md bg-muted/10 px-3 py-2 text-sm text-foreground outline-none focus:bg-muted/20 focus:ring-2 focus:ring-foreground min-h-[70px]"
              placeholder="Brief context on this resource..."
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Resource'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
