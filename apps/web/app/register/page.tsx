'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../lib/i18n';

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: '', color: '', width: '0%' };
  if (pw.length < 6) return { label: 'Weak', color: 'bg-red-500', width: '25%' };
  if (pw.length < 8) return { label: 'Fair', color: 'bg-orange-500', width: '50%' };
  if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pw)) return { label: 'Strong', color: 'bg-green-500', width: '100%' };
  if (/(?=.*[a-z])(?=.*\d)/.test(pw)) return { label: 'Good', color: 'bg-yellow-500', width: '75%' };
  return { label: 'Fair', color: 'bg-orange-500', width: '50%' };
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const strength = passwordStrength(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError(t('register.error.fillFields')); return; }
    if (password.length < 8) { setError(t('register.error.passwordLength')); return; }
    if (!agree) { setError(t('register.error.agreeTerms')); return; }
    setLoading(true);
    try {
      await register(email, password, name);
      router.push('/onboarding');
    } catch (err: any) {
      let msg = err.message || t('register.error.failed');
      try { const p = JSON.parse(msg); msg = p?.error?.message || p?.message || msg; } catch {}
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, #e8edf5 0%, #d5dce8 50%, #c5d0df 100%)' }}>
      {/* Left: Hero */}
      <div className="hidden w-1/2 flex-col items-center justify-center p-12 lg:flex">
        <div className="max-w-lg text-center">
          <div className="relative mx-auto h-72 w-80">
            <div className="absolute bottom-0 left-1/2 h-4 w-48 -translate-x-1/2 rounded-full bg-black/10 blur-sm" />
            <div className="absolute bottom-1 left-1/2 h-3 w-40 -translate-x-1/2 rounded-full bg-black/8 blur-[2px]" />
            <div className="absolute bottom-4 left-1/2 h-44 w-72 -translate-x-1/2 rounded-xl border-2 border-gray-300 bg-white shadow-2xl shadow-black/15">
              <div className="flex h-6 items-center gap-1.5 border-b border-gray-100 px-3">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <div className="h-2 w-2 rounded-full bg-green-400" />
              </div>
              <div className="flex h-[calc(100%-24px)] items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-600">{t('app.name')}</div>
                  <div className="mt-1 text-xs text-gray-400">{t('app.tagline')}</div>
                </div>
              </div>
            </div>
            <div className="absolute bottom-3 left-1/2 h-3 w-64 -translate-x-1/2 rounded-b-lg bg-gray-300 shadow-md" />
            <div className="absolute bottom-0 left-1/2 h-4 w-20 -translate-x-1/2 rounded-t-sm bg-gray-400" />
            <div className="absolute -left-4 top-4 h-28 w-44 rounded-xl border border-white/60 bg-white/70 shadow-lg shadow-black/10 backdrop-blur-xl">
              <div className="flex h-5 items-center gap-1 border-b border-gray-100/50 px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-green-300" />
              </div>
              <div className="p-2 text-left">
                <div className="mb-1 h-1.5 w-20 rounded bg-brand-200" />
                <div className="mb-1 h-1.5 w-32 rounded bg-gray-200" />
                <div className="h-1.5 w-24 rounded bg-gray-100" />
              </div>
            </div>
            <div className="absolute -right-3 bottom-24 h-32 w-40 rounded-xl border border-white/60 bg-white/70 shadow-lg shadow-black/10 backdrop-blur-xl">
              <div className="flex h-5 items-center gap-1 border-b border-gray-100/50 px-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-300" />
                <div className="h-1.5 w-1.5 rounded-full bg-green-300" />
              </div>
              <div className="p-2 text-left">
                <div className="mb-1 h-1.5 w-16 rounded bg-green-200" />
                <div className="mb-1 h-1.5 w-28 rounded bg-gray-200" />
                <div className="h-1.5 w-20 rounded bg-gray-100" />
              </div>
            </div>
          </div>

          <h2 className="mt-12 text-3xl font-bold tracking-tight text-gray-800">
            {t('register.hero.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            {t('register.hero.desc')}
          </p>

          <div className="mt-8 flex items-center justify-center gap-2">
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex gap-1.5">
              <span className="h-2 w-6 rounded-full bg-brand-500" />
              <span className="h-2 w-2 rounded-full bg-gray-300" />
              <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex w-full items-center justify-center px-4 py-8 lg:w-1/2">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl shadow-black/5">
          {/* Card header: logo + lang */}
          <div className="flex items-center justify-between px-8 pt-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">G</div>
              <span className="text-lg font-bold text-gray-800">{t('app.name')}</span>
            </div>
            <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 bg-white focus:outline-none"
              value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'ja')}>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          {/* Title */}
          <div className="px-8 pt-6">
            <h1 className="text-xl font-bold text-gray-900">{t('register.title')}</h1>
          </div>

          {/* Google button */}
          <div className="px-8 pt-5">
            <button className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                  <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.3"/><path d="M12 6c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 2c-.83 0-1.5.67-1.5 1.5S11.17 11 12 11s1.5-.67 1.5-1.5S12.83 8 12 8zm0 5c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">John Doe</div>
                  <div className="text-xs text-gray-400 truncate">john.doe@gmail.com</div>
                </div>
              </div>
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-8 pt-5">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pt-4 pb-8 space-y-3.5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label htmlFor="name" className="sr-only">{t('register.name')}</label>
              <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
                placeholder={t('register.name')} autoComplete="name" />
            </div>

            <div>
              <label htmlFor="email" className="sr-only">{t('register.email')}</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
                placeholder={t('register.email')} autoComplete="email" />
            </div>

            <div className="relative">
              <label htmlFor="password" className="sr-only">{t('register.password')}</label>
              <input id="password" type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-10 text-sm shadow-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
                placeholder={t('register.password')} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
              {password && (
                <div className="mt-1.5">
                  <div className="h-1 w-full rounded-full bg-gray-100">
                    <div className={`h-1 rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">{strength.label}</p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2 pt-1">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
              <span className="text-xs text-gray-500">
                {t('register.agree')} <a href="#" className="text-gray-700 underline hover:text-gray-900">{t('register.terms')}</a> and the <a href="#" className="text-gray-700 underline hover:text-gray-900">{t('register.privacy')}</a>.
              </span>
            </label>

            <button type="submit" disabled={loading || !agree}
              className="w-full rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-40">
              {loading ? t('register.creating') : t('register.createAccount')}
            </button>

            <p className="pt-2 text-center text-xs text-gray-500">
              {t('register.haveAccount')}{' '}
              <a href="/login" className="underline text-gray-700 hover:text-gray-900">{t('register.logIn')}</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
