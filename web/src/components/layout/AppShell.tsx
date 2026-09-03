'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, Users, BookOpen, Bell, ArrowRightLeft, Settings, LogOut } from 'lucide-react';
import { SessionContext } from '@/lib/session';
import { updateActiveScope } from '@/lib/sessionActions';

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

  const handleScopeSwitch = async (scopeId: string) => {
    setIsSwitching(true);
    await updateActiveScope(scopeId);
    setProfileOpen(false);
    setIsSwitching(false);
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-muted/5 border-r-0">
        <div className="p-5 flex items-center space-x-3">
          <div className="h-7 w-7 rounded bg-foreground flex items-center justify-center">
            <span className="text-background text-sm font-bold">J</span>
          </div>
          <span className="font-semibold text-base tracking-tight">Joel Academy</span>
        </div>
        
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-muted/10 text-foreground' : 'text-muted hover:bg-muted/5 hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span>{item.label}</span>
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
            <div className="h-6 w-6 rounded bg-foreground flex items-center justify-center">
              <span className="text-background text-xs font-bold">J</span>
            </div>
            <span className="font-semibold text-sm">Joel Academy</span>
          </div>

          <div className="flex items-center space-x-3">
            {session.canSeeRequests && (
              <button 
                onClick={() => setRequestsOpen(true)}
                className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-muted/10 hover:bg-muted/20 transition-colors relative"
              >
                <ArrowRightLeft className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }}
                className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-muted/10 hover:bg-muted/20 transition-colors relative"
              >
                <Bell className="h-5 w-5" strokeWidth={1.5} />
                {/* Badge example */}
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="fixed sm:absolute top-16 sm:top-auto sm:mt-2 right-4 sm:right-0 left-4 sm:left-auto w-auto sm:w-80 bg-background rounded-[12px] shadow-lg z-50 overflow-hidden">
                    <div className="p-3 bg-muted/5 flex items-center justify-between">
                      <span className="font-semibold text-sm">Notifications</span>
                      <button className="text-xs text-muted hover:text-foreground">Mark read</button>
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
                className="h-10 w-10 flex items-center justify-center rounded-[12px] bg-muted/10 hover:bg-muted/20 transition-colors"
              >
                <span className="font-medium text-sm">{session.profile?.name?.charAt(0) || 'U'}</span>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-background rounded-[12px] shadow-lg  z-50 overflow-hidden py-1 text-sm">
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
                            className="w-full text-left px-4 py-2 hover:bg-muted/10 flex items-center justify-between"
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
                      <Link href="/login" className="flex items-center space-x-2 px-4 py-2 hover:bg-muted/10 text-red-600" onClick={() => setProfileOpen(false)}>
                        <LogOut className="h-4 w-4" strokeWidth={1.5} />
                        <span>Logout</span>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-auto bg-background pb-20 md:pb-0 relative">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around bg-background/90 backdrop-blur-md pb-safe border-t-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] dark:shadow-[0_-1px_3px_rgba(255,255,255,0.02)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 p-2 w-full h-full transition-colors ${
                isActive ? 'text-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              <div className={`flex items-center justify-center h-8 w-8 rounded-full ${isActive ? 'bg-muted/10' : ''}`}>
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cross-Team Requests Modal */}
      {requestsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setRequestsOpen(false)} />
          <div className="relative bg-background rounded-[12px] shadow-2xl  w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4  flex items-center justify-between">
              <h2 className="font-semibold">Cross-Team Requests</h2>
              <button onClick={() => setRequestsOpen(false)} className="text-muted hover:text-foreground">✕</button>
            </div>
            <div className="p-8 text-center text-muted flex-1 overflow-y-auto">
              Requests UI goes here
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
