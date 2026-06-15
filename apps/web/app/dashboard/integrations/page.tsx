'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);

  useEffect(() => {
    api.getIntegrations().then(setIntegrations).catch(() => {});
  }, []);

  async function connectX() {
    try {
      const { authUrl } = await api.getAuthUrl('X', window.location.origin + '/integrations/callback');
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to get auth URL', err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <h3 className="font-semibold text-gray-900">X (Twitter)</h3>
            <p className="text-sm text-gray-500">
              {integrations.find((i) => i.platform === 'X')
                ? `Connected as @${integrations.find((i) => i.platform === 'X')?.platformUserName}`
                : 'Connect your X account for posting and analytics'}
            </p>
          </div>
          <button
            onClick={connectX}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {integrations.find((i) => i.platform === 'X') ? 'Reconnect' : 'Connect'}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 opacity-50">
          <div>
            <h3 className="font-semibold text-gray-900">Instagram</h3>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
          <button disabled className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-500">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
