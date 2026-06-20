'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

const PLATFORMS = [
  { id: 'X', label: 'X (Twitter)', maxChars: 280 },
  { id: 'INSTAGRAM', label: 'Instagram', maxChars: 2200 },
  { id: 'TIKTOK', label: 'TikTok', maxChars: 2200 },
  { id: 'YOUTUBE', label: 'YouTube', maxChars: 5000 },
  { id: 'LINKEDIN', label: 'LinkedIn', maxChars: 3000 },
  { id: 'THREADS', label: 'Threads', maxChars: 500 },
];

const PLATFORM_HINTS: Record<string, string> = {
  X: 'Supports text, links, and media. Max 280 characters.',
  INSTAGRAM: 'Single image posts. Max 2,200 characters.',
  TIKTOK: 'Short-form video descriptions. Max 2,200 characters.',
  YOUTUBE: 'Video descriptions. Max 5,000 characters.',
  LINKEDIN: 'Professional content. Max 3,000 characters.',
  THREADS: 'Short text posts. Max 500 characters.',
};

export default function NewPostPage() {
  const [contentText, setContentText] = useState('');
  const [platform, setPlatform] = useState('X');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('scheduledAt');
    if (dateParam) setScheduledAt(dateParam);
    api.getIntegrations().then(setIntegrations).catch(() => {});
  }, []);

  const currentPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const connectedAccounts = integrations.filter((i) => i.platform === platform && i.status === 'CONNECTED');
  const charCount = contentText.length;
  const overLimit = charCount > currentPlatform.maxChars;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (overLimit) {
      setError(`${platform} posts are limited to ${currentPlatform.maxChars.toLocaleString()} characters`);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.createPost({
        contentText,
        platform,
        integrationAccountId: selectedAccount || undefined,
        scheduledAt: scheduledAt || undefined,
      });
      router.push('/dashboard/posts');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">&larr; Back</button>
        <h1 className="text-2xl font-bold text-gray-900">New Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Platform</label>
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setSelectedAccount(''); }}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400">{PLATFORM_HINTS[platform]}</p>
        </div>

        {connectedAccounts.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Connected Account (optional)</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Post to any connected account</option>
              {connectedAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.platformUserName || acc.id} {acc.isDemo ? '(Demo)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content
            <span className={`ml-2 font-normal ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
              ({charCount}/{currentPlatform.maxChars.toLocaleString()})
            </span>
          </label>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            rows={6}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="What do you want to share?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !contentText.trim() || overLimit}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : scheduledAt ? 'Schedule Post' : 'Create Draft'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/posts')}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
