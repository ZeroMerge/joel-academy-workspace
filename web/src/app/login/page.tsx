'use client';

import * as React from 'react';
import { login } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Joel Academy
          </h1>
          <p className="text-sm text-muted">
            Enter your credentials to continue
          </p>
        </div>
        
        <form action={login} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@joel.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
