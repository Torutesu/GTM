'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';

export default function IntegrationCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const platform = new URLSearchParams(window.location.hash.replace('#', '?')).get('platform') || 'X';

    if (!code || !state) {
      setStatus('error');
      return;
    }

    api.handleCallback(platform, code, state)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/dashboard/integrations'), 1500);
      })
      .catch(() => {
        setStatus('error');
      });
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Connecting...</h1>
            <p className="mt-2 text-gray-500">Please wait while we connect your account.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-2xl font-bold text-green-600">Connected!</h1>
            <p className="mt-2 text-gray-500">Redirecting you back...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-600">Connection Failed</h1>
            <p className="mt-2 text-gray-500">Please try again.</p>
          </>
        )}
      </div>
    </div>
  );
}
