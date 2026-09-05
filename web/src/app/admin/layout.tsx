import { getSessionContext } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';
import { logout } from '@/app/login/actions';
import { AdminDesktopNav, AdminMobileNav } from './AdminNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  
  if (!session || !session.isAdmin) {
    redirect('/home');
  }

  const hasNonAdminRole = session.roles.some(r => r.base_role !== 'admin');

  return (
    <div className="flex h-[100dvh] w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-muted/5 border-r-0 select-none">
        <div className="p-5 flex items-center space-x-3 text-red-600">
          <Shield className="h-7 w-7" strokeWidth={1.5} />
          <span className="font-semibold text-base tracking-tight text-foreground">Admin Console</span>
        </div>
        
        <AdminDesktopNav />

        {hasNonAdminRole ? (
          <div className="p-4">
            <Link href="/home" className="flex items-center justify-center space-x-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 text-foreground py-2.5 rounded-2xl transition-colors">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
              <span>Switch to App</span>
            </Link>
          </div>
        ) : (
          <div className="p-4">
            <form action={logout}>
              <button type="submit" className="w-full flex items-center justify-center space-x-2 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-600 py-2.5 rounded-2xl transition-colors cursor-pointer">
                <span>Logout</span>
              </button>
            </form>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="md:hidden flex-none h-16 px-4 flex items-center justify-between bg-background/80 backdrop-blur-sm z-40 sticky top-0">
          <div className="flex items-center space-x-2 text-red-600">
            <Shield className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-semibold text-sm text-foreground">Admin Console</span>
          </div>
          {hasNonAdminRole ? (
            <Link href="/home" className="text-xs font-semibold text-muted hover:text-foreground px-3 py-1.5 bg-muted/10 rounded-xl">Exit</Link>
          ) : (
            <form action={logout}>
              <button type="submit" className="text-xs font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-500/10 rounded-xl cursor-pointer">Logout</button>
            </form>
          )}
        </header>

        <main className="flex-1 overflow-auto bg-background p-4 sm:p-8 pb-24 md:pb-8 relative">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Tabs */}
      <AdminMobileNav />
    </div>
  );
}