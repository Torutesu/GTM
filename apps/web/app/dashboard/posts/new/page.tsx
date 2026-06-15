'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';

export default function NewPostPage() {
  const [contentText, setContentText] = useState('');
  const [platform, setPlatform] = useState('X');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (platform === 'X' && contentText.length > 280) {
      setError('X posts are limited to 280 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.createPost({ contentText, platform });
      router.push('/dashboard/posts');
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="X">X (Twitter)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content
            <span className="ml-2 text-gray-400 font-normal">
              ({contentText.length}/280)
            </span>
          </label>
          <textarea
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            rows={4}
            maxLength={280}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="What's happening?"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !contentText.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Draft'}
        </button>
      </form>
    </div>
  );
}
