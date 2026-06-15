'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api } from '../../../lib/api';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [postFrequency, setPostFrequency] = useState(5);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getMe().then((res: any) => {
      setName(res.data.name);
      const settings = res.data.settings || {};
      setBrandTone(settings.brandTone || 'professional');
      setPostFrequency(settings.postFrequency || 5);
    }).catch(() => {});
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      await api.updateMe({
        name,
        settings: { brandTone, postFrequency, ngKeywords: [], kpiTargets: {} },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brand Tone</label>
          <select
            value={brandTone}
            onChange={(e) => setBrandTone(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="humorous">Humorous</option>
            <option value="educational">Educational</option>
            <option value="inspirational">Inspirational</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Weekly Post Frequency: {postFrequency}
          </label>
          <input
            type="range"
            min={1}
            max={21}
            value={postFrequency}
            onChange={(e) => setPostFrequency(parseInt(e.target.value))}
            className="mt-1 w-full"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
