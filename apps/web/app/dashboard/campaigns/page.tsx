'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import Link from 'next/link';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCampaigns().then(setCampaigns).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete campaign', err);
    }
  }

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-100 text-green-700' :
    s === 'completed' ? 'bg-blue-100 text-blue-700' :
    s === 'paused' ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500">Manage your marketing campaigns</p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-900">No campaigns yet</p>
          <p className="mt-1 text-sm text-gray-500">Create your first campaign to start organizing your marketing efforts.</p>
          <Link href="/dashboard/campaigns/new" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
            Create Campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <Link href={`/dashboard/campaigns/${c.id}`} className="text-lg font-semibold text-gray-900 hover:text-brand-600">{c.name}</Link>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>{c.status}</span>
              </div>
              {c.goal && <p className="line-clamp-2 text-sm text-gray-600 mb-3">{c.goal}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{c._count?.posts || 0} posts</span>
                <span>{c._count?.tasks || 0} tasks</span>
                {c.budget && <span>${c.budget}</span>}
              </div>
              {c.startDate && (
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(c.startDate).toLocaleDateString()}{c.endDate ? ` - ${new Date(c.endDate).toLocaleDateString()}` : ''}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 pt-3 border-t border-gray-100">
                <Link href={`/dashboard/campaigns/${c.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-700">View</Link>
                <button onClick={() => handleDelete(c.id, c.name)} className="text-xs font-medium text-red-600 hover:text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
