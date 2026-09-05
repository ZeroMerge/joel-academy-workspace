'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, Users, BookOpen, Bell, ArrowRightLeft, Settings, LogOut } from 'lucide-react';
import { SessionContext } from '@/lib/session';
import { updateActiveScope } from '@/lib/sessionActions';
import { logout } from '@/app/login/actions';

export function AppShell({ children, session }: { children: React.ReactNode; session: SessionContext }) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/team', label: session.activeScope?.name || 'Team', icon: Users },
    { href: '/resources', label: 'Resources', icon: BookOpen },
  ];

  const isItemActive = (href: string) => {
    if (href === '/home') {
      return pathname === '/home' || pathname === '/' || pathname === '';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleScopeSwitch = async (scopeId: string) => {
    setIsSwitching(true);
    await updateActiveScope(scopeId);
    setProfileOpen(false);
    setIsSwitching(false);
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar (YouTube Style) */}
      <aside className="hidden md:flex w-64 flex-col bg-muted/5 border-r-0 select-none">
        <div className="p-5 flex items-center space-x-3">
          <img src="/logo.jpg" alt="Joel Academy" className="h-8 w-8 rounded-[12px] object-cover shrink-0" />
          <span className="font-semibold text-base tracking-tight">Joel Academy</span>
        </div>

        <nav className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);
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
                {/* Active indicator bar */}
                <div className={`w-1 h-5 rounded-full transition-all ${active ? 'bg-foreground' : 'bg-transparent'}`} />
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'stroke-[2.2] text-foreground' : 'stroke-[1.5] text-muted'}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="flex-none h-16 px-4 flex items-center justify-between md:justify-end bg-background/80 backdrop-blur-sm z-40 sticky top-0">
          <div className="md:hidden flex items-center space-x-2">
            <img src="/logo.jpg" alt="Joel Academy" className="h-7 w-7 rounded-[8px] object-cover shrink-0" />
            <span className="font-semibold text-sm">Joel Academy</span>
          </div>

          <div className="flex items-center space-x-3">
            {session.canSeeRequests && (
              <button
                onClick={() => setRequestsOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-muted/10 hover:bg-muted/20 transition-colors relative cursor-pointer"
                title="Cross-team Requests"
              >
                <ArrowRightLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-muted/10 hover:bg-muted/20 transition-colors relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="fixed sm:absolute top-16 sm:top-auto sm:mt-2 right-4 sm:right-0 left-4 sm:left-auto w-auto sm:w-80 bg-background rounded-2xl shadow-xl z-50 overflow-hidden border-0">
                    <div className="p-3 bg-muted/5 flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      <button className="text-xs text-muted hover:text-foreground cursor-pointer">Mark read</button>
                    </div>
                    <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
                      <div className="p-4 text-center text-sm text-muted">No new notifications.</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }}
                className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer"
                title="User Profile"
              >
                <span className="font-medium text-sm">{session.profile?.name?.charAt(0) || 'U'}</span>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-background rounded-2xl shadow-xl z-50 overflow-hidden py-1 text-sm border-0">
                    <div className="px-4 py-3 bg-muted/5">
                      <p className="font-medium truncate">{session.profile?.name}</p>
                      <p className="text-xs text-muted truncate">@{session.profile?.handle}</p>
                    </div>

                    <div className="py-1">
                      <Link href="/profile" className="flex items-center space-x-2 px-4 py-2 hover:bg-muted/10" onClick={() => setProfileOpen(false)}>
                        <Settings className="h-4 w-4" strokeWidth={1.5} />
                        <span>Settings</span>
                      </Link>
                    </div>

                    {session.isMultiScope && (
                      <div className="py-1 bg-muted/5">
                        <div className="px-4 py-1 text-xs font-medium text-muted uppercase tracking-wider">Switch Scope</div>
                        {session.roles.map(role => (
                          <button
                            key={role.scope_id}
                            disabled={isSwitching}
                            onClick={() => handleScopeSwitch(role.scope_id!)}
                            className="w-full text-left px-4 py-2 hover:bg-muted/10 flex items-center justify-between cursor-pointer"
                          >
                            <span className="truncate">{role.scope_name}</span>
                            {session.activeScope?.id === role.scope_id && <span className="text-xs font-bold">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}

                    {(session.canSeeCapacity || session.canSeeReports) && (
                      <div className="py-1">
                        {session.canSeeCapacity && (
                          <Link href="/capacity" className="block px-4 py-2 hover:bg-muted/10" onClick={() => setProfileOpen(false)}>Team Capacity</Link>
                        )}
                        {session.canSeeReports && (
                          <Link href="/reports" className="block px-4 py-2 hover:bg-muted/10" onClick={() => setProfileOpen(false)}>Weekly Reports</Link>
                        )}
                      </div>
                    )}

                    {session.isAdmin && (
                      <div className="py-1 bg-muted/5">
                        <Link href="/admin/health" className="block px-4 py-2 hover:bg-muted/10 text-blue-600 dark:text-blue-400 font-medium" onClick={() => setProfileOpen(false)}>
                          Switch to Admin
                        </Link>
                      </div>
                    )}

                    <div className="py-1">
                      <button 
                        onClick={() => { setProfileOpen(false); logout(); }} 
                        className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-muted/10 text-red-600 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.5} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto bg-background pb-24 md:pb-0 relative">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tabs — YouTube Style Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-background/95 backdrop-blur-lg pb-safe border-0 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] select-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                active ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {/* YouTube Style Active Pill */}
              <div className={`flex items-center justify-center px-4 py-1 rounded-full transition-all ${
                active ? 'bg-muted/15 text-foreground' : 'bg-transparent text-muted'
              }`}>
                <Icon className={`h-5 w-5 transition-transform ${active ? 'stroke-[2.2] scale-105 text-foreground' : 'stroke-[1.5]'}`} />
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

      {/* Cross-Team Requests Modal */}
      {requestsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setRequestsOpen(false)} />
          <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border-0">
            <div className="p-4 bg-muted/5 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Cross-Team Requests</h2>
              <button onClick={() => setRequestsOpen(false)} className="text-muted hover:text-foreground cursor-pointer">✕</button>
            </div>
            <div className="p-8 text-center text-muted flex-1 overflow-y-auto text-sm">
              No pending cross-team requests.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}