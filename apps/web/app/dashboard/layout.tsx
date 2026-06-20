'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { DashboardNav } from '../../components/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const settings = (user as any).settings || {};
      const onboardingDone = settings?.onboardingDone;
      if (!onboardingDone && pathname !== '/onboarding') {
        router.push('/onboarding');
      }
    }
  }, [loading, isAuthenticated, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardNav user={user!} onLogout={logout} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
