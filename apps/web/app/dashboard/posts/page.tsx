'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    api.getPosts().then((res) => setPosts(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <a
          href="/dashboard/posts/new"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New Post
        </a>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">No posts yet</p>
          </div>
        ) : (
          posts.map((post: any) => (
            <div key={post.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-900">{post.contentText}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{post.platform}</span>
                <span className={`rounded-full px-2 py-0.5 font-medium ${
                  post.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                  post.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                  post.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {post.status}
                </span>
                {post.isAiGenerated && (
                  <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                    AI Generated
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
