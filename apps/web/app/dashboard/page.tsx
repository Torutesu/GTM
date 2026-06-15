'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export default function DashboardPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    api.getIntegrations().then(setIntegrations).catch(() => {});
    api.getPosts({ limit: '10' }).then((res) => setPosts(res.data)).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your AI-powered marketing command center
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-500">Connected Accounts</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{integrations.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-500">Total Posts</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{posts.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-medium text-gray-500">Pending Tasks</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {tasks.filter((t: any) => t.status === 'PENDING').length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
        <div className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No posts yet. Connect an account and create your first post.
            </p>
          ) : (
            posts.map((post: any) => (
              <div key={post.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div className="flex-1 truncate pr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.contentText}
                  </p>
                  <p className="text-xs text-gray-500">
                    {post.platform} · {post.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">AI Tasks</h2>
        <div className="mt-4 space-y-3">
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">
              No AI tasks yet. Ask the chat to analyze your growth.
            </p>
          ) : (
            tasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    {task.agentType} · {task.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
