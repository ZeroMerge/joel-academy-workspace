import { getSessionContext } from '@/lib/session';
import { AppShell } from '@/components/layout/AppShell';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  
  if (!session) {
    redirect('/login');
  }

  const isPureAdmin = session.roles.length > 0 && session.roles.every(r => r.base_role === 'admin');
  if (isPureAdmin) {
    redirect('/admin/people');
  }

  return (
    <AppShell session={session}>
      {children}
    </AppShell>
  );
}
