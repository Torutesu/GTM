'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';

function CallbackHandler() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') || '';

    if (!code || !state) {
      setStatus('error');
      setErrorMsg('Missing authorization code or state parameter');
      return;
    }

    const platform = state.includes(':') ? state.split(':')[0] : 'X';

    api.handleCallback(platform, code, state)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/dashboard/integrations'), 1500);
      })
      .catch((err: any) => {
        setStatus('error');
        const raw = err?.message || '';
        try {
          const parsed = JSON.parse(raw);
          setErrorMsg(parsed?.error?.message || parsed?.message || raw);
        } catch {
          setErrorMsg(raw || 'Failed to connect account');
        }
      });
  }, [searchParams, router]);

  return (
    <>
      {status === 'processing' && (
        <>
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <h1 className="text-xl font-bold text-gray-900">Connecting...</h1>
          <p className="mt-2 text-sm text-gray-500">Please wait while we connect your account.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 className="text-xl font-bold text-green-600">Connected!</h1>
          <p className="mt-2 text-sm text-gray-500">Redirecting you back...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-red-600">Connection Failed</h1>
          <p className="mt-2 text-sm text-gray-600">{errorMsg || 'Please try again.'}</p>
          <button onClick={() => router.push('/dashboard/integrations')} className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
            Back to Integrations
          </button>
        </>
      )}
    </>
  );
}

export default function IntegrationCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <Suspense fallback={
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <h1 className="text-xl font-bold text-gray-900">Connecting...</h1>
          </>
        }>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
