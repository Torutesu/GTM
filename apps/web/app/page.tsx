'use client';

import { useI18n } from '../lib/i18n';

export default function Home() {
  const { t, locale, setLocale } = useI18n();
  const plans = [
    { name: 'Free', price: '$0', period: '/mo', desc: 'Perfect for getting started', features: ['1 social account', '5 AI-generated posts/mo', 'Basic analytics', 'Community support'], cta: 'Get Started', href: '/register', featured: false },
    { name: 'Pro', price: '$29', period: '/mo', desc: 'For growing teams', features: ['Up to 5 social accounts', 'Unlimited AI posts', 'Advanced analytics', 'Priority support', 'Content calendar', 'AI agent access'], cta: 'Start Free Trial', href: '/register', featured: true },
    { name: 'Enterprise', price: '$99', period: '/mo', desc: 'For scale & automation', features: ['Unlimited social accounts', 'Custom AI agents', 'API access', 'Dedicated support', 'Custom integrations', 'SLA guarantee'], cta: 'Contact Sales', href: '/register', featured: false },
  ];
  const features = [
    { icon: '🤖', title: '8 AI Agents', desc: 'Growth strategy, social media, competitor intel, SEO, outreach, and more — all working in parallel.' },
    { icon: '📊', title: 'Smart Analytics', desc: 'Real-time dashboards with engagement metrics, audience insights, and ROI tracking.' },
    { icon: '📅', title: 'Content Calendar', desc: 'AI-powered scheduling with optimal posting times across all your platforms.' },
    { icon: '🔗', title: 'Multi-Platform', desc: 'Connect X, Instagram, TikTok, YouTube, LinkedIn, and Threads — all from one place.' },
    { icon: '🛡️', title: 'Policy Guardrails', desc: 'Built-in content moderation with severity scoring and automated violation detection.' },
    { icon: '💬', title: 'AI Chat Director', desc: 'Your marketing director in chat — ask questions, get strategies, execute instantly.' },
  ];
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-brand-600">{t('app.name')}</span>
          </div>
          <nav className="hidden items-center gap-8 sm:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">{t('lp.features')}</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">{t('lp.pricing')}</a>
            <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">{t('lp.signIn')}</a>
            <a href="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">{t('lp.getStarted')}</a>
            <select className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-500 bg-white focus:outline-none"
              value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'ja')}>
              <option value="en">EN</option>
              <option value="ja">JA</option>
            </select>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28 lg:pt-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {t('lp.hero.title1')}
            <span className="block text-brand-600">{t('lp.hero.title2')}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            {t('lp.hero.desc')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <a href="/register" className="rounded-lg bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-all">
              {t('lp.hero.cta')}
            </a>
            <a href="#features" className="rounded-lg border border-gray-300 px-8 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              {t('lp.hero.seeFeatures')}
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">{t('lp.hero.freeNote')}</p>
        </div>
      </section>

      <section id="features" className="border-t border-gray-100 bg-gray-50/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('lp.features.title')}</h2>
            <p className="mt-4 text-lg text-gray-600">{t('lp.features.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-100/20">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('lp.how.title')}</h2>
            <p className="mt-4 text-lg text-gray-600">{t('lp.how.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              { step: '01', titleKey: 'lp.how.step1.title', descKey: 'lp.how.step1.desc' },
              { step: '02', titleKey: 'lp.how.step2.title', descKey: 'lp.how.step2.desc' },
              { step: '03', titleKey: 'lp.how.step3.title', descKey: 'lp.how.step3.desc' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-600">{s.step}</div>
                <h3 className="mt-6 text-lg font-semibold text-gray-900">{t(s.titleKey)}</h3>
                <p className="mt-2 text-sm text-gray-600">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-gray-100 bg-gray-50/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('lp.pricing.title')}</h2>
            <p className="mt-4 text-lg text-gray-600">{t('lp.pricing.subtitle')}</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border p-8 transition-all hover:shadow-lg ${plan.featured ? 'border-brand-500 bg-white shadow-xl shadow-brand-100/20 ring-1 ring-brand-500' : 'border-gray-200 bg-white'}`}>
                {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">Most Popular</div>}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">{plan.desc}</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-sm text-gray-500">{plan.period}</span>
                  </div>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                      <svg className="h-4 w-4 flex-shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={plan.href} className={`mt-8 flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all ${plan.featured ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-lg font-bold text-brand-600">{t('app.name')}</span>
          <p className="mt-2 text-sm text-gray-500">{t('lp.footer.tagline')}</p>
          <p className="mt-6 text-xs text-gray-400">&copy; {new Date().getFullYear()} GON. {t('lp.footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
