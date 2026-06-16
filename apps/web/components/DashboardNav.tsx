'use client';

import Link from 'next/link';

interface DashboardNavProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

export function DashboardNav({ user, onLogout }: DashboardNavProps) {
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'AI Agents', href: '/dashboard/agents' },
    { label: 'Posts', href: '/dashboard/posts' },
    { label: 'Calendar', href: '/dashboard/calendar' },
    { label: 'Chat', href: '/dashboard/chat' },
    { label: 'Integrations', href: '/dashboard/integrations' },
    { label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <nav className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-brand-600">
          GON
        </Link>
      </div>
      <div className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-700">{user.name}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
        <button
          onClick={onLogout}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
