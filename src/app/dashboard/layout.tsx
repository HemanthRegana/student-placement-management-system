import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen md:flex">
      <div className="hidden md:block">
        <Sidebar name={user.name} role={user.role} />
      </div>

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex justify-end">
            <NotificationBell />
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}