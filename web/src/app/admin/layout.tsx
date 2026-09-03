import { getSessionContext } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, Activity, Users, FileText, ArrowLeft, Settings } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  
  if (!session || !session.isAdmin) {
    redirect('/home');
  }

  const hasNonAdminRole = session.roles.some(r => r.base_role !== 'admin');

  const navItems = [
    { href: '/admin/health', label: 'Org Health', icon: Activity },
    { href: '/admin/people', label: 'Org Capacity', icon: Users },
    { href: '/admin/decisions', label: 'Org Decisions', icon: FileText },
    { href: '/admin/audit', label: 'Audit Log', icon: FileText },
    { href: '/admin/scopes', label: 'Admin Utilities', icon: Settings },
  ];

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-muted/5 border-r-0">
        <div className="p-5 flex items-center space-x-3 text-red-600">
          <Shield className="h-7 w-7" strokeWidth={1.5} />
          <span className="font-semibold text-base tracking-tight">Admin Console</span>
        </div>
        
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-muted hover:bg-muted/10 hover:text-foreground transition-colors"
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {hasNonAdminRole && (
          <div className="p-4 ">
            <Link href="/home" className="flex items-center justify-center space-x-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 text-foreground py-2 rounded-[12px] transition-colors">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              <span>Switch to Role View</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="md:hidden flex-none h-16 px-4 flex items-center justify-between bg-background/80 backdrop-blur-sm z-40 sticky top-0 ">
          <div className="flex items-center space-x-2 text-red-600">
            <Shield className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-semibold text-sm">Admin Console</span>
          </div>
          {hasNonAdminRole && (
            <Link href="/home" className="text-sm font-medium text-muted hover:text-foreground">Exit</Link>
          )}
        </header>

        <main className="flex-1 overflow-auto bg-background p-4 sm:p-8 relative">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-[4.5rem] items-center justify-around bg-background/90 backdrop-blur-md pb-safe border-t-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center space-y-1 p-2 w-full h-full transition-colors text-muted hover:text-foreground"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
