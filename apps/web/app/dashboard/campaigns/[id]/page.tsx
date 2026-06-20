'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import Link from 'next/link';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    api.getCampaign(id).then(setCampaign).catch(() => router.push('/dashboard/campaigns'));
  }, [id, router]);

  async function handleUpdateStatus(status: string) {
    try {
      const updated = await api.updateCampaign(id, { status });
      setCampaign(updated);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    try {
      const updated = await api.updateCampaign(id, { name: name.trim() });
      setCampaign(updated);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update name', err);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this campaign?')) return;
    try {
      await api.deleteCampaign(id);
      router.push('/dashboard/campaigns');
    } catch (err) {
      console.error('Failed to delete', err);
    }
  }

  if (!campaign) return <div className="text-sm text-gray-500">Loading...</div>;

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-green-100 text-green-700' :
    s === 'completed' ? 'bg-blue-100 text-blue-700' :
    s === 'paused' ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">&larr; Campaigns</button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-lg font-bold focus:border-brand-500 focus:outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} />
              <button onClick={handleSaveName} className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white">Save</button>
              <button onClick={() => setEditing(false)} className="text-sm text-gray-500">Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
              <button onClick={() => { setName(campaign.name); setEditing(true); }} className="text-sm text-gray-400 hover:text-gray-600">✎</button>
            </div>
          )}
          {campaign.goal && <p className="mt-1 text-sm text-gray-600">{campaign.goal}</p>}
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span>Posts: {campaign._count?.posts || 0}</span>
            <span>Tasks: {campaign._count?.tasks || 0}</span>
            {campaign.budget && <span>Budget: ${campaign.budget}</span>}
            {campaign.startDate && <span>{new Date(campaign.startDate).toLocaleDateString()}{campaign.endDate ? ` - ${new Date(campaign.endDate).toLocaleDateString()}` : ''}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor(campaign.status)}`}>{campaign.status}</span>
          <div className="flex gap-1 ml-2">
            {campaign.status !== 'active' && <button onClick={() => handleUpdateStatus('active')} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">Activate</button>}
            {campaign.status === 'active' && <button onClick={() => handleUpdateStatus('paused')} className="rounded bg-yellow-600 px-2 py-1 text-xs text-white hover:bg-yellow-700">Pause</button>}
            {campaign.status !== 'completed' && <button onClick={() => handleUpdateStatus('completed')} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">Complete</button>}
          </div>
        </div>
      </div>

      {/* KPI Targets */}
      {campaign.kpiTargets && Object.keys(campaign.kpiTargets).length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">KPI Targets</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {Object.entries(campaign.kpiTargets).map(([key, value]: [string, any]) => (
              <div key={key} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Posts ({campaign.posts?.length || 0})</h2>
          <Link href={`/dashboard/posts/new`} className="text-sm font-medium text-brand-600 hover:text-brand-700">+ New Post</Link>
        </div>
        {(!campaign.posts || campaign.posts.length === 0) ? (
          <p className="text-sm text-gray-500">No posts in this campaign yet.</p>
        ) : (
          <div className="space-y-2">
            {campaign.posts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex-1 truncate pr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.contentText}</p>
                  <p className="text-xs text-gray-500">{p.platform}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  p.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                  p.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{p.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Tasks ({campaign.tasks?.length || 0})</h2>
        {(!campaign.tasks || campaign.tasks.length === 0) ? (
          <p className="text-sm text-gray-500">No AI tasks for this campaign. Run an agent to analyze this campaign.</p>
        ) : (
          <div className="space-y-2">
            {campaign.tasks.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex-1 truncate pr-4">
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.agentType}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  t.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  t.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard/campaigns')} className="text-sm text-gray-500 hover:text-gray-700">&larr; Back to Campaigns</button>
        <button onClick={handleDelete} className="text-sm text-red-600 hover:text-red-700 ml-auto">Delete Campaign</button>
      </div>
    </div>
  );
}
