'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SuggestionWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, isAnonymous })
      });
      
      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setMessage('');
          setIsAnonymous(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Trigger Widget */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer text-center sm:text-left gap-4" onClick={() => setIsOpen(true)}>
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center justify-center sm:justify-start space-x-2">
            <MessageSquare className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <span>Something on your mind?</span>
          </h3>
          <p className="text-sm text-muted">Drop a suggestion or feedback directly to leadership.</p>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
          Send Feedback
        </Button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative bg-background rounded-none shadow-2xl  w-full max-w-lg flex flex-col overflow-hidden">
            <div className="p-4  flex items-center justify-between">
              <h2 className="font-semibold flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
                <span>Suggestion Box</span>
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-muted hover:text-foreground">✕</button>
            </div>
            
            <div className="p-6">
              {isSuccess ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <CheckSquare className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <p className="font-semibold">Suggestion Sent!</p>
                  <p className="text-sm text-muted">Thank you for your feedback.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Message</label>
                    <textarea 
                      className="w-full min-h-[120px] p-3 bg-muted/5 border border-divider/50 rounded-none focus:outline-none focus:ring-1 focus:ring-foreground resize-none"
                      placeholder="What could we do better?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input 
                      type="checkbox" 
                      id="anonymous" 
                      className="h-4 w-4 rounded-none border-divider"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    <label htmlFor="anonymous" className="text-sm text-muted cursor-pointer">
                      Submit anonymously
                    </label>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSubmitting || !message.trim()} className="w-full sm:w-auto flex items-center space-x-2">
                      <span>{isSubmitting ? 'Sending...' : 'Send Suggestion'}</span>
                      <Send className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
