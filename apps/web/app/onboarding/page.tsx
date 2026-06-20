'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const INDUSTRIES = [
  { id: 'ecommerce', label: 'E-commerce / Retail', icon: '🛍️' },
  { id: 'saas', label: 'SaaS / Tech', icon: '💻' },
  { id: 'finance', label: 'Finance / Fintech', icon: '💰' },
  { id: 'health', label: 'Health & Wellness', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'entertainment', label: 'Entertainment / Media', icon: '🎬' },
  { id: 'agency', label: 'Agency / Consulting', icon: '🤝' },
  { id: 'other', label: 'Other', icon: '✨' },
];

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Formal, authoritative, trust-building' },
  { id: 'casual', label: 'Casual & Friendly', desc: 'Conversational, approachable, warm' },
  { id: 'humorous', label: 'Humorous', desc: 'Witty, playful, meme-friendly' },
  { id: 'inspirational', label: 'Inspirational', desc: 'Motivational, aspirational, uplifting' },
  { id: 'edgy', label: 'Bold & Edgy', desc: 'Provocative, daring, trendsetting' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>;
  if (!isAuthenticated) { router.push('/login'); return null; }

  async function finish() {
    setLoading(true);
    setError('');
    try {
      await api.updateMe({ settings: { onboardingDone: true, brandName, industry, tone, onboardedAt: new Date().toISOString() } });
      await refreshUser();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
      setLoading(false);
    }
  }

  function next() {
    if (step === 0 && !brandName.trim()) { setError('Please enter your brand name'); return; }
    if (step === 1 && !industry) { setError('Please select an industry'); return; }
    setError('');
    setStep(step + 1);
  }

  const steps = [
    { num: 1, label: 'Brand' },
    { num: 2, label: 'Industry' },
    { num: 3, label: 'Tone' },
    { num: 4, label: 'Done' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-12 sm:px-6">
        <div className="text-center">
          <span className="text-2xl font-bold text-brand-600">GON</span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${i <= step ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{s.num}</div>
              <span className={`text-sm font-medium ${i <= step ? 'text-gray-900' : 'text-gray-400'}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`h-px w-8 transition-colors ${i < step ? 'bg-brand-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="mt-16 flex-1">
          {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {step === 0 && (
            <div className="text-center">
              <span className="text-5xl">👋</span>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Welcome to GON, {user?.name}!</h2>
              <p className="mt-2 text-gray-500">Let&apos;s set up your brand in under a minute.</p>
              <div className="mt-8 text-left">
                <label className="block text-sm font-medium text-gray-700">What&apos;s your brand or company name?</label>
                <input type="text" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Acme Inc."
                  className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
              </div>
              <button onClick={next} className="mt-8 w-full rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">Continue</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">What industry are you in?</h2>
              <p className="mt-2 text-center text-gray-500">We&apos;ll tailor AI suggestions to your niche.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {INDUSTRIES.map((ind) => (
                  <button key={ind.id} onClick={() => { setIndustry(ind.id); }} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${industry === ind.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <span className="text-2xl">{ind.icon}</span>
                    <span className="font-medium text-gray-900">{ind.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={next} className="flex-1 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">Continue</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-center text-2xl font-bold text-gray-900">Choose your brand voice</h2>
              <p className="mt-2 text-center text-gray-500">This helps our AI match your communication style.</p>
              <div className="mt-8 grid gap-3">
                {TONES.map((t) => (
                  <button key={t.id} onClick={() => setTone(t.id)} className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${tone === t.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <div>
                      <div className="font-medium text-gray-900">{t.label}</div>
                      <div className="text-sm text-gray-500">{t.desc}</div>
                    </div>
                    {tone === t.id && <span className="text-brand-600">✓</span>}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={next} className="flex-1 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <span className="text-5xl">🚀</span>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">You&apos;re all set!</h2>
              <p className="mt-2 text-gray-500">Here&apos;s what we&apos;ve configured:</p>
              <div className="mx-auto mt-8 max-w-sm space-y-3 text-left">
                <div className="rounded-lg bg-gray-50 p-3 text-sm"><span className="font-medium text-gray-700">Brand:</span> <span className="text-gray-900">{brandName}</span></div>
                <div className="rounded-lg bg-gray-50 p-3 text-sm"><span className="font-medium text-gray-700">Industry:</span> <span className="text-gray-900">{INDUSTRIES.find(i => i.id === industry)?.label}</span></div>
                <div className="rounded-lg bg-gray-50 p-3 text-sm"><span className="font-medium text-gray-700">Voice:</span> <span className="text-gray-900">{TONES.find(t => t.id === tone)?.label}</span></div>
                <div className="rounded-lg bg-gray-50 p-3 text-sm"><span className="font-medium text-gray-700">Plan:</span> <span className="text-gray-900">Free (upgrade anytime)</span></div>
              </div>
              <p className="mt-6 text-sm text-gray-500">You can change all of this later in Settings.</p>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={finish} disabled={loading} className="flex-1 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50">
                  {loading ? 'Setting up...' : 'Go to Dashboard →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
