'use client';

import { useEffect, useState, useMemo } from 'react';
import { api } from '../../../lib/api';

const PLATFORM_LABELS: Record<string, string> = {
  X: 'X', INSTAGRAM: 'Instagram', TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube', LINKEDIN: 'LinkedIn', THREADS: 'Threads',
};

const PLATFORM_COLORS: Record<string, string> = {
  X: '#1d9bf0', INSTAGRAM: '#e4405f', TIKTOK: '#000000',
  YOUTUBE: '#ff0000', LINKEDIN: '#0a66c2', THREADS: '#000000',
};

interface Post {
  id: string; contentText: string; platform: string; status: string;
  scheduledAt: string | null; postedAt: string | null; createdAt: string;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  return map;
}

export default function AnalyticsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d');

  useEffect(() => {
    Promise.all([
      api.getPosts({ limit: '200' }),
      api.getIntegrations(),
    ]).then(([postsRes, ints]) => {
      setPosts(Array.isArray(postsRes) ? postsRes : postsRes?.data ?? []);
      setIntegrations(ints);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const now = useMemo(() => new Date(), []);
  const cutoffDate = useMemo(() => {
    if (timeRange === 'all') return null;
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(timeRange));
    return d;
  }, [timeRange, now]);

  const filteredPosts = useMemo(() => {
    if (!cutoffDate) return posts;
    return posts.filter((p) => new Date(p.createdAt) >= cutoffDate!);
  }, [posts, cutoffDate]);

  const byStatus = useMemo(() => groupBy(filteredPosts, (p) => p.status), [filteredPosts]);
  const byPlatform = useMemo(() => groupBy(filteredPosts, (p) => p.platform), [filteredPosts]);

  const totalPosts = filteredPosts.length;
  const published = byStatus['PUBLISHED']?.length ?? 0;
  const drafts = byStatus['DRAFT']?.length ?? 0;
  const scheduled = byStatus['SCHEDULED']?.length ?? 0;
  const failed = byStatus['FAILED']?.length ?? 0;
  const connectedAccounts = integrations.filter((i) => i.status === 'CONNECTED').length;
  const connectedPlatforms = [...new Set(integrations.filter((i) => i.status === 'CONNECTED').map((i) => i.platform))].length;

  // Posts per day for the time range
  const dailyActivity = useMemo(() => {
    if (!cutoffDate) return [];
    const map: Record<string, number> = {};
    const days: string[] = [];
    const d = new Date(cutoffDate);
    for (let i = 0; i <= parseInt(timeRange); i++) {
      const key = d.toISOString().slice(0, 10);
      days.push(key);
      map[key] = 0;
      d.setDate(d.getDate() + 1);
    }
    for (const p of filteredPosts) {
      const key = new Date(p.createdAt).toISOString().slice(0, 10);
      if (map[key] !== undefined) map[key]++;
    }
    return days.map((day) => ({ label: day.slice(5), value: map[day] }));
  }, [filteredPosts, cutoffDate, timeRange]);

  const barMax = Math.max(...dailyActivity.map((d) => d.value), 1);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">Post performance and account insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="14d">Last 14 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Total Posts" value={totalPosts} color="text-gray-900" />
        <KpiCard label="Published" value={published} color="text-green-600" />
        <KpiCard label="Scheduled" value={scheduled} color="text-yellow-600" />
        <KpiCard label="Drafts" value={drafts} color="text-blue-600" />
        <KpiCard label="Failed" value={failed} color="text-red-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Post Activity Timeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">
            Post Activity {timeRange !== 'all' ? `(last ${timeRange})` : '(all time)'}
          </h2>
          {dailyActivity.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">No data</div>
          ) : (
            <div className="flex items-end gap-1.5" style={{ height: 140 }}>
              {dailyActivity.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium text-gray-500">{d.value || ''}</span>
                  <div
                    className="w-full rounded-t bg-brand-500 transition-all"
                    style={{ height: `${Math.max((d.value / barMax) * 100, d.value > 0 ? 4 : 0)}px` }}
                  />
                  {dailyActivity.length <= 14 && (
                    <span className="text-[10px] text-gray-400">{d.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-900">Status Breakdown</h2>
          {totalPosts === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">No posts</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Published', value: published, color: 'bg-green-500' },
                { label: 'Draft', value: drafts, color: 'bg-blue-500' },
                { label: 'Scheduled', value: scheduled, color: 'bg-yellow-500' },
                { label: 'Failed', value: failed, color: 'bg-red-500' },
              ].map((s) => s.value > 0 && (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{s.label}</span>
                    <span className="font-medium text-gray-900">{s.value}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${s.color}`} style={{ width: `${(s.value / totalPosts) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Distribution */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Platform Distribution</h2>
        {Object.keys(byPlatform).length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-gray-400">No posts across any platform</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(byPlatform)
              .sort(([, a], [, b]) => b.length - a.length)
              .map(([platform, platformPosts]) => {
                const publishedCount = platformPosts.filter((p) => p.status === 'PUBLISHED').length;
                const pct = totalPosts > 0 ? Math.round((platformPosts.length / totalPosts) * 100) : 0;
                return (
                  <div key={platform} className="rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{PLATFORM_LABELS[platform] || platform}</span>
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gray-900">{platformPosts.length}</span>
                      <span className="text-xs text-gray-500">total</span>
                    </div>
                    <div className="mt-1 text-xs text-green-600">{publishedCount} published</div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Account Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Account Overview</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">Connected accounts</p>
            <p className="text-xl font-bold text-gray-900">{connectedAccounts}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Platforms connected</p>
            <p className="text-xl font-bold text-gray-900">{connectedPlatforms}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Posts published</p>
            <p className="text-xl font-bold text-gray-900">{published}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Success rate</p>
            <p className="text-xl font-bold text-gray-900">
              {totalPosts > 0 ? `${Math.round((published / totalPosts) * 100)}%` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
