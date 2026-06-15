'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { DashboardNav } from '../../components/DashboardNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <DashboardNav user={user!} onLogout={logout} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
