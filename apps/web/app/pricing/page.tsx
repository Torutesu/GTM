'use client';

import { useAuth } from '../../hooks/useAuth';

const PLANS = [
  {
    name: 'Free', price: '$0', period: '/month', desc: 'Perfect for exploring AI marketing',
    features: ['1 social account', '5 AI-generated posts/month', 'Basic analytics dashboard', '1 AI agent (Growth Strategy)', 'Community support'],
    cta: 'Get Started', href: '/register', featured: false,
  },
  {
    name: 'Pro', price: '$29', period: '/month', desc: 'For serious content creators',
    features: ['Up to 5 social accounts', 'Unlimited AI-generated posts', 'Advanced analytics & insights', 'All 8 AI agents', 'Content calendar & scheduling', 'Priority email support', 'Custom brand voice'],
    cta: 'Start Free Trial', href: '/register', featured: true,
  },
  {
    name: 'Enterprise', price: '$99', period: '/month', desc: 'For teams & agencies',
    features: ['Unlimited social accounts', 'Unlimited AI posts', 'Custom AI agent training', 'API access', 'Team collaboration (up to 10 seats)', 'Dedicated account manager', 'Custom integrations', '99.9% SLA'],
    cta: 'Contact Sales', href: '/register', featured: false,
  },
];

const COMPARE = [
  { feature: 'Social accounts', free: '1', pro: '5', ent: 'Unlimited' },
  { feature: 'AI posts/month', free: '5', pro: 'Unlimited', ent: 'Unlimited' },
  { feature: 'AI agent types', free: '1', pro: '8', ent: '8 + Custom' },
  { feature: 'Content calendar', free: '—', pro: '✓', ent: '✓' },
  { feature: 'Analytics', free: 'Basic', pro: 'Advanced', ent: 'Advanced + API' },
  { feature: 'Team seats', free: '1', pro: '1', ent: '10' },
  { feature: 'Support', free: 'Community', pro: 'Priority email', ent: 'Dedicated + SLA' },
];

export default function PricingPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="text-2xl font-bold text-brand-600">GON</a>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <a href="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">Dashboard</a>
            ) : (
              <>
                <a href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign In</a>
                <a href="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">Get Started</a>
              </>
            )}
          </nav>
        </div>
      </header>

      <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Simple, transparent pricing</h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">Start free. Upgrade when you need more power.</p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border p-8 transition-all hover:shadow-lg ${plan.featured ? 'border-brand-500 bg-white shadow-xl shadow-brand-100/20 ring-1 ring-brand-500 scale-105' : 'border-gray-200 bg-white'}`}>
                {plan.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-semibold text-white">Most Popular</div>}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-gray-500">{plan.desc}</p>
                  <div className="mt-6 flex items-baseline justify-center gap-1">
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

          <div className="mt-24">
            <h2 className="text-center text-2xl font-bold text-gray-900">Compare plans</h2>
            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Free</th>
                    <th className="px-6 py-4 text-center font-semibold text-brand-600">Pro</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-6 py-4 text-gray-700">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{row.free}</td>
                      <td className="px-6 py-4 text-center font-medium text-brand-600">{row.pro}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{row.ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-xl font-bold text-gray-900">Ready to transform your marketing?</h2>
            <p className="mt-2 text-gray-500">Join teams using GON to automate their social presence.</p>
            <a href={isAuthenticated ? '/dashboard' : '/register'} className="mt-6 inline-block rounded-lg bg-brand-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 transition-all">
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free — No Credit Card'}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <span className="text-lg font-bold text-brand-600">GON</span>
          <p className="mt-2 text-sm text-gray-500">Autonomous AI-powered marketing platform</p>
        </div>
      </footer>
    </div>
  );
}
