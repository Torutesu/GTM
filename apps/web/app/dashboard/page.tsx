'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';

function BarChart({ data, className }: { data: { label: string; value: number; color: string }[]; className?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={`flex items-end gap-2 ${className || ''}`}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-xs font-medium text-gray-700">{d.value}</span>
          <div className="w-full rounded-t" style={{ height: `${Math.max((d.value / max) * 120, 8)}px`, backgroundColor: d.color }} />
          <span className="text-xs text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ total, segments }: { total: number; segments: { label: string; value: number; color: string }[] }) {
  if (total === 0) return <div className="flex items-center justify-center h-32 text-sm text-gray-400">No data</div>;
  const R = 60, r = 40;
  let offset = 0;
  const arcs = segments.map((s) => {
    const pct = s.value / total;
    const angle = pct * 360;
    const startAngle = (offset - 90) * Math.PI / 180;
    const endAngle = (offset + angle - 90) * Math.PI / 180;
    offset += angle;
    const x1 = R + R * Math.cos(startAngle);
    const y1 = R + R * Math.sin(startAngle);
    const x2 = R + R * Math.cos(endAngle);
    const y2 = R + R * Math.sin(endAngle);
    const large = angle > 180 ? 1 : 0;
    return { key: s.label, d: `M${R},${R} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z` as const, color: s.color, label: s.label, value: s.value };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={R * 2 + 10} height={R * 2 + 10} viewBox={`0 0 ${R * 2 + 10} ${R * 2 + 10}`}>
        <circle cx={R + 5} cy={R + 5} r={r} fill="white" />
        {arcs.map((a) => <path key={a.key} d={a.d as any} fill={a.color} transform="translate(5,5)" />)}
        <text x={R + 5} y={R + 5} textAnchor="middle" dominantBaseline="central" className="text-lg font-bold fill-gray-900">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {segments.filter((s) => s.value > 0).map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-medium text-gray-900">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    api.getIntegrations().then(setIntegrations).catch(() => {});
    api.getPosts({ limit: '10' }).then((res) => setPosts(res.data)).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
  }, []);

  const pendingTasks = tasks.filter((t: any) => t.status === 'PENDING');
  const publishedPosts = posts.filter((p: any) => p.status === 'PUBLISHED');
  const draftPosts = posts.filter((p: any) => p.status === 'DRAFT');
  const agentTypes = [...new Set(tasks.map((t: any) => t.agentType))];

  const statusSegments = [
    { label: 'Published', value: publishedPosts.length, color: '#22c55e' },
    { label: 'Drafts', value: draftPosts.length, color: '#eab308' },
    { label: 'Pending', value: posts.length - publishedPosts.length - draftPosts.length, color: '#6b7280' },
  ];

  const platformData = [...new Set(posts.map((p: any) => p.platform))].map((p) => ({
    label: p, value: posts.filter((po: any) => po.platform === p).length, color: p === 'X' ? '#1d9bf0' : '#e4405f',
  }));

  const taskStatusSegments = [
    { label: 'Completed', value: tasks.filter((t: any) => t.status === 'COMPLETED').length, color: '#22c55e' },
    { label: 'Pending', value: pendingTasks.length, color: '#eab308' },
    { label: 'Failed', value: tasks.filter((t: any) => t.status === 'CANCELLED').length, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Your AI-powered marketing command center</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/posts/new" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
            + New Post
          </Link>
          <Link href="/dashboard/agents" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            AI Agents
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-lg">🔗</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Connected Accounts</p>
              <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-lg">📝</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-lg">⏳</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-lg">🤖</span>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agentTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Post Status</h2>
          <DonutChart total={posts.length} segments={statusSegments} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Platform Distribution</h2>
          {platformData.length > 0 ? (
            <BarChart data={platformData} className="h-36" />
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">No posts yet</div>
          )}
        </div>
      </div>

      {/* Task Efficiency Chart */}
      {tasks.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Task Efficiency</h2>
          <DonutChart total={tasks.length} segments={taskStatusSegments} />
        </div>
      )}

      {/* Recent Posts + AI Tasks Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <Link href="/dashboard/posts" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>
          </div>
          <div className="space-y-2">
            {posts.length === 0 ? (
              <p className="text-sm text-gray-500">No posts yet. Connect an account and create your first post.</p>
            ) : (
              posts.slice(0, 5).map((post: any) => (
                <div key={post.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 truncate pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{post.contentText}</p>
                    <p className="text-xs text-gray-500">{post.platform}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                    post.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    post.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{post.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">AI Tasks</h2>
            <Link href="/dashboard/agents" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Run agent</Link>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500">No AI tasks yet. Run an agent from the Agents page.</p>
            ) : (
              tasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 truncate pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.agentType}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{task.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
