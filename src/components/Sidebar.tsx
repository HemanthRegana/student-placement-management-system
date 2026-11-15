
import Link from 'next/link';
import {
  GraduationCap,
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileText,
  UserRound,
  LogOut,
  Settings,
  BarChart3,
  Bell,
} from 'lucide-react';

export default function Sidebar({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const isStaff = ['OFFICER', 'SUPER_ADMIN'].includes(role);

  const links = [

    {
     href: '/dashboard/notifications',
     label: 'Notifications',
     icon: Bell,
    },
    
    {
      href: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    },

    

    ...(role === 'STUDENT'
      ? [
          {
            href: '/dashboard/profile',
            label: 'My Academic Profile',
            icon: UserRound,
          },
        ]
      : []),

    {
      href: '/dashboard/jobs',
      label: 'Placement drives',
      icon: BriefcaseBusiness,
    },

    ...(isStaff
      ? [
          {
            href: '/dashboard/manage-drives',
            label: 'Manage Drives',
            icon: Settings,
          },
          {
            href: '/dashboard/analytics',
            label: 'Analytics',
            icon: BarChart3,
          },
          {
            href: '/dashboard/students',
            label: 'Students',
            icon: Users,
          },
        ]
      : []),

    {
      href: '/dashboard/applications',
      label: 'Applications',
      icon: FileText,
    },

    ...(role === 'SUPER_ADMIN'
      ? [
          {
            href: '/dashboard/officers',
            label: 'Placement Officers',
            icon: Users,
          },
        ]
      : []),
  ];

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-200 bg-white px-5 py-6">
      <Link href="/" className="mb-10 flex items-center gap-3">
        <span className="rounded-xl bg-blue-600 p-2 text-white">
          <GraduationCap size={23} />
        </span>

        <span>
          <b className="block text-lg">CampusFlow</b>
          <small className="text-slate-500">
            Placement portal
          </small>
        </span>
      </Link>

      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        Workspace
      </p>

      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-2xl bg-slate-50 p-3">
        <div className="text-sm font-semibold">{name}</div>
        <div className="mt-1 text-xs text-slate-500">
          {role}
        </div>

        <Link
          href="/api/auth/logout"
          className="mt-3 flex items-center gap-2 text-xs text-slate-500"
        >
          <LogOut size={14} />
          Sign out
        </Link>
      </div>
    </aside>
  );
}
