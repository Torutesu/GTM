'use client';

import { useState, useEffect, FormEvent } from 'react';
import { api } from '../../../lib/api';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [postFrequency, setPostFrequency] = useState(5);
  const [saved, setSaved] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [postReminders, setPostReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    api.getMe().then((res: any) => {
      setName(res.name);
      const settings = res.settings || {};
      setBrandTone(settings.brandTone || 'professional');
      setPostFrequency(settings.postFrequency || 5);
      if (settings.notifications) {
        setEmailNotifications(settings.notifications.email ?? true);
        setPostReminders(settings.notifications.postReminders ?? true);
        setWeeklyDigest(settings.notifications.weeklyDigest ?? false);
      }
    }).catch(() => {});
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    try {
      await api.updateMe({
        name,
        settings: { brandTone, postFrequency, ngKeywords: [], kpiTargets: {}, notifications: { email: emailNotifications, postReminders, weeklyDigest } },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings', err);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brand Tone</label>
          <select value={brandTone} onChange={(e) => setBrandTone(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="humorous">Humorous</option>
            <option value="educational">Educational</option>
            <option value="inspirational">Inspirational</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Weekly Post Frequency: {postFrequency}</label>
          <input type="range" min={1} max={21} value={postFrequency} onChange={(e) => setPostFrequency(parseInt(e.target.value))} className="mt-1 w-full accent-brand-600" />
        </div>

        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>

      {/* Notifications */}
      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          <span className="text-sm text-gray-700">Email notifications</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={postReminders} onChange={(e) => setPostReminders(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          <span className="text-sm text-gray-700">Post schedule reminders</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" checked={weeklyDigest} onChange={(e) => setWeeklyDigest(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
          <span className="text-sm text-gray-700">Weekly performance digest</span>
        </label>
        <button onClick={handleSave} className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
          Save Preferences
        </button>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>

        {passwordError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{passwordError}</div>}
        {passwordSuccess && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{passwordSuccess}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <button type="submit" disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors">
          {passwordLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
