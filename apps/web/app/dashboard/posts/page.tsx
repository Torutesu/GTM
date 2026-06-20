'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';

const PLATFORMS = ['X', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'THREADS'] as const;
const STATUSES = ['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED'] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SCHEDULED: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  PUBLISHING: 'bg-purple-100 text-purple-700',
};

const PLATFORM_LABELS: Record<string, string> = {
  X: 'X (Twitter)',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  YOUTUBE: 'YouTube',
  LINKEDIN: 'LinkedIn',
  THREADS: 'Threads',
};

interface Post {
  id: string;
  contentText: string;
  platform: string;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  createdAt: string;
  isAiGenerated: boolean;
  platformPostId: string | null;
  integrationAccount?: { platformUserName: string } | null;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPlatform) params.platform = filterPlatform;
      params.limit = '50';
      const res = await api.getPosts(params);
      setPosts(Array.isArray(res) ? res : res?.data ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPlatform]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  async function handleAction(id: string, action: 'approve' | 'publish' | 'delete') {
    setActionLoading(id);
    try {
      if (action === 'approve') await api.approvePost(id);
      else if (action === 'publish') await api.publishPost(id);
      else await api.deletePost(id);
      await fetchPosts();
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  function canApprove(post: Post) { return post.status === 'DRAFT'; }
  function canPublish(post: Post) { return post.status === 'APPROVED' || post.status === 'SCHEDULED'; }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <a
          href="/dashboard/posts/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + New Post
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Platforms</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No posts found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Content</th>
                <th className="px-4 py-3 font-medium text-gray-600">Platform</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Schedule</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="max-w-xs px-4 py-3">
                    <p className="truncate text-gray-900">{post.contentText}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString()}
                      {post.isAiGenerated && (
                        <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-purple-600">AI</span>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{PLATFORM_LABELS[post.platform] || post.platform}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[post.status] || 'bg-gray-100 text-gray-700'}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canApprove(post) && (
                        <button
                          onClick={() => handleAction(post.id, 'approve')}
                          disabled={actionLoading === post.id}
                          className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {canPublish(post) && (
                        <button
                          onClick={() => handleAction(post.id, 'publish')}
                          disabled={actionLoading === post.id}
                          className="rounded bg-green-500 px-2 py-1 text-xs text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(post.id, 'delete')}
                        disabled={actionLoading === post.id}
                        className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
