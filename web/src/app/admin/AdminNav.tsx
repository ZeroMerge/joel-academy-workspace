'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Users, FileText, Settings } from 'lucide-react';

const navItems = [
  { href: '/admin/health', label: 'Org Health', icon: Activity },
  { href: '/admin/people', label: 'People', icon: Users },
  { href: '/admin/decisions', label: 'Decisions', icon: FileText },
  { href: '/admin/audit', label: 'Audit Log', icon: FileText },
  { href: '/admin/scopes', label: 'Scopes', icon: Settings },
];

export function AdminDesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1.5 p-3 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 rounded-2xl px-3 py-2.5 text-sm transition-all ${
              active 
                ? 'bg-muted/15 text-foreground font-semibold shadow-xs' 
                : 'text-muted hover:bg-muted/5 hover:text-foreground font-medium'
            }`}
          >
            <div className={`w-1 h-5 rounded-full transition-all ${active ? 'bg-red-600' : 'bg-transparent'}`} />
            <Icon className={`h-5 w-5 shrink-0 ${active ? 'stroke-[2.2] text-red-600' : 'stroke-[1.5] text-muted'}`} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-background/95 backdrop-blur-lg pb-safe border-0 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              active ? 'text-foreground' : 'text-muted hover:text-foreground'
            }`}
          >
            <div className={`flex items-center justify-center px-3.5 py-1 rounded-full transition-all ${
              active ? 'bg-red-500/10 text-red-600' : 'bg-transparent text-muted'
            }`}>
              <Icon className={`h-5 w-5 transition-transform ${active ? 'stroke-[2.2] scale-105 text-red-600' : 'stroke-[1.5]'}`} />
            </div>
            <span className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              active ? 'font-bold text-foreground' : 'font-medium text-muted'
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}