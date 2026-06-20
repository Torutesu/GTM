'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '../lib/i18n';

interface DashboardNavProps {
  user: { name: string; email: string };
  onLogout: () => void;
}

export function DashboardNav({ user, onLogout }: DashboardNavProps) {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();

  const navItems = [
    { labelKey: 'nav.dashboard', href: '/dashboard', icon: '📊' },
    { labelKey: 'nav.agents', href: '/dashboard/agents', icon: '🤖' },
    { labelKey: 'nav.posts', href: '/dashboard/posts', icon: '📝' },
    { labelKey: 'nav.campaigns', href: '/dashboard/campaigns', icon: '🎯' },
    { labelKey: 'nav.analytics', href: '/dashboard/analytics', icon: '📈' },
    { labelKey: 'nav.calendar', href: '/dashboard/calendar', icon: '📅' },
    { labelKey: 'nav.chat', href: '/dashboard/chat', icon: '💬' },
    { labelKey: 'nav.integrations', href: '/dashboard/integrations', icon: '🔗' },
    { labelKey: 'nav.billing', href: '/dashboard/billing', icon: '💳' },
    { labelKey: 'nav.settings', href: '/dashboard/settings', icon: '⚙️' },
  ];

  return (
    <nav className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
        <Link href="/dashboard" className="text-xl font-bold text-brand-600">
          {t('app.name')}
        </Link>
        <button
          onClick={() => setLocale(locale === 'en' ? 'ja' : 'en')}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="Toggle language"
        >
          {locale === 'en' ? 'JA' : 'EN'}
        </button>
      </div>
      <div className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
      <div className="border-t border-gray-200 p-4">
        <div className="text-sm font-medium text-gray-700">{user.name}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
        <button
          onClick={onLogout}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          {t('nav.signOut')}
        </button>
      </div>
    </nav>
  );
}
