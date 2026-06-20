'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';

const PLATFORMS = [
  { id: 'X', name: 'X (Twitter)', icon: '𝕏', color: 'bg-black hover:bg-gray-800', connectedColor: 'bg-gray-100 text-black', desc: 'Post tweets, engage with followers' },
  { id: 'INSTAGRAM', name: 'Instagram', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600', connectedColor: 'bg-pink-50 text-pink-600', desc: 'Share photos, reels, stories' },
  { id: 'TIKTOK', name: 'TikTok', icon: '🎵', color: 'bg-black hover:bg-gray-800', connectedColor: 'bg-gray-100 text-black', desc: 'Short-form video content' },
  { id: 'YOUTUBE', name: 'YouTube', icon: '▶️', color: 'bg-red-600 hover:bg-red-700', connectedColor: 'bg-red-50 text-red-600', desc: 'Long-form video, shorts' },
  { id: 'LINKEDIN', name: 'LinkedIn', icon: '💼', color: 'bg-blue-600 hover:bg-blue-700', connectedColor: 'bg-blue-50 text-blue-600', desc: 'Professional network, B2B content' },
  { id: 'THREADS', name: 'Threads', icon: '🧵', color: 'bg-black hover:bg-gray-800', connectedColor: 'bg-gray-100 text-black', desc: 'Text-based conversations' },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [status, setStatus] = useState<Record<string, { configured: boolean; demoAvailable: boolean }> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api.getIntegrations().then(setIntegrations).catch(() => {});
    api.getPlatformStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function connect(platform: string) {
    setLoading(platform);
    setError(null);
    try {
      const platformStatus = status?.[platform];
      if (!platformStatus?.configured && platformStatus?.demoAvailable) {
        await api.demoConnect(platform);
        refresh();
        return;
      }
      const redirectUri = window.location.origin + '/integrations/callback';
      const { authUrl } = await api.getAuthUrl(platform, redirectUri);
      window.location.href = authUrl;
    } catch (err: any) {
      const msg = err?.message || 'Connection failed.';
      try {
        const parsed = JSON.parse(msg);
        setError(parsed?.error?.message || msg);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(null);
    }
  }

  async function disconnect(id: string) {
    try {
      await api.disconnectIntegration(id);
      refresh();
    } catch (err) {
      console.error('Disconnect failed', err);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="mt-1 text-sm text-gray-500">Connect your social media accounts to enable AI-powered posting and analytics</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {PLATFORMS.map((platform) => {
          const connected = integrations.find((i) => i.platform === platform.id);
          const isDemo = connected?.platformUserId?.startsWith('demo_');
          return (
            <div key={platform.id} className={`rounded-xl border bg-white p-5 transition-all ${connected ? 'border-green-200 ring-1 ring-green-100' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    <p className="text-xs text-gray-500">{platform.desc}</p>
                  </div>
                </div>
                {connected && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isDemo ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {isDemo ? 'Demo' : 'Connected'}
                  </span>
                )}
              </div>

              {connected && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">@{connected.platformUserName}</span>
                      {isDemo && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">Demo</span>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      connected.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{connected.status}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {connected ? (
                  <>
                    <button
                      onClick={() => connect(platform.id)}
                      disabled={loading !== null}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 ${isDemo ? 'border-brand-200 text-brand-700 hover:bg-brand-50' : 'text-white ' + platform.color}`}
                    >
                      {loading === platform.id ? 'Connecting...' : isDemo ? 'Upgrade to Live' : 'Reconnect'}
                    </button>
                    <button
                      onClick={() => disconnect(connected.id)}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => connect(platform.id)}
                    disabled={loading !== null}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50 ${platform.color}`}
                  >
                    {loading === platform.id ? 'Connecting...' : status?.[platform.id]?.configured ? 'Connect' : 'Connect (Demo)'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
