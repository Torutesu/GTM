'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

export default function CalendarPage() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    api.getPosts().then((res) => setPosts(res.data)).catch(() => {});
  }, []);

  async function generatePlan() {
    try {
      const result = await api.executeAgent('social_media', { platform: 'X', frequency: 5 });
      alert(`Generated ${result.result?.weeklyPlan?.length || 0} posts!`);
      window.location.reload();
    } catch (err) {
      console.error('Failed to generate plan', err);
    }
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-sm text-gray-500">Weekly content plan</p>
        </div>
        <button
          onClick={generatePlan}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Generate Weekly Plan
        </button>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {dayNames.map((day, idx) => {
          const dayIndex = [1, 2, 3, 4, 5, 6, 0][idx];
          return (
            <div key={day} className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900">{day}</h3>
              <div className="mt-2 space-y-2">
                {posts
                  .filter((p) => {
                    const d = p.createdAt ? new Date(p.createdAt) : new Date();
                    return d.getDay() === dayIndex;
                  })
                  .map((post: any) => (
                    <div key={post.id} className="rounded bg-gray-50 p-2 text-xs">
                      <p className="truncate text-gray-900">{post.contentText}</p>
                      <span className="text-gray-500">{post.status}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
