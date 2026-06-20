'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import Link from 'next/link';

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    api.getPosts({ limit: '100' }).then((res: any) => setPosts(res.data || res)).catch(() => {});
  }, []);

  const days = getMonthDays(year, month);

  const postsByDate = posts.reduce((acc: Record<string, any[]>, p: any) => {
    const d = p.scheduledAt || p.createdAt;
    if (d) {
      const key = new Date(d).getDate().toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
    }
    return acc;
  }, {} as Record<string, any[]>);

  const selectedPosts = selectedDay ? postsByDate[selectedDay.toString()] || [] : [];

  const goPrev = useCallback(() => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }, [month]);

  const goNext = useCallback(() => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }, [month]);

  const goToday = useCallback(() => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today.getDate());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-sm text-gray-500">Schedule and manage your posts</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/posts/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            + New Post
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button onClick={goPrev} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
            <button onClick={goNext} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <button onClick={goToday} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Today</button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">{d}</div>
          ))}
        </div>

        {/* Day Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected = day === selectedDay;
            const dayPosts = day ? postsByDate[day.toString()] || [] : [];
            return (
              <button
                key={i}
                onClick={() => day && setSelectedDay(day)}
                className={`min-h-[100px] border-b border-r border-gray-100 p-2 text-left transition-colors hover:bg-gray-50 ${
                  isSelected ? 'bg-brand-50 ring-2 ring-inset ring-brand-500' : ''
                } ${!day ? 'bg-gray-50' : ''}`}
              >
                {day && (
                  <>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                      isToday ? 'bg-brand-600 text-white font-bold' : 'font-medium text-gray-700'
                    }`}>{day}</span>
                    {dayPosts.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {dayPosts.slice(0, 3).map((p: any) => (
                          <div key={p.id} className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight ${
                            p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                            p.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                            p.status === 'APPROVED' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{p.contentText}</div>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-[11px] font-medium text-gray-400 px-1.5">+{dayPosts.length - 3} more</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detail */}
      {selectedDay && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{MONTHS[month]} {selectedDay}, {year}</h3>
            <Link
              href={`/dashboard/posts/new?scheduledAt=${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              + Schedule Post
            </Link>
          </div>
          {selectedPosts.length === 0 ? (
            <p className="text-sm text-gray-500">No posts scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedPosts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 truncate pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.contentText}</p>
                    <p className="text-xs text-gray-500">{p.platform}{p.scheduledAt ? ` · ${new Date(p.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
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
      )}
    </div>
  );
}
