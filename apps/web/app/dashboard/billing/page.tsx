'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';

const PLAN_LABELS: Record<string, { name: string; color: string; features: string[] }> = {
  free: { name: 'Free', color: 'bg-gray-100 text-gray-700', features: ['1 social account', '5 AI posts/month', '1 AI agent'] },
  pro: { name: 'Pro', color: 'bg-brand-100 text-brand-700', features: ['5 social accounts', 'Unlimited AI posts', 'All 8 AI agents', 'Priority support'] },
  enterprise: { name: 'Enterprise', color: 'bg-purple-100 text-purple-700', features: ['Unlimited accounts', 'Unlimited AI posts', 'Custom agents', 'Dedicated support'] },
};

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.getBillingSubscription(),
      api.getBillingPlans(),
    ]).then(([sub, plans]) => {
      setSubscription(sub);
      setPlans(plans);
    }).finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: string) {
    setUpgrading(true);
    setMessage('');
    try {
      const result = await api.upgradePlan(plan);
      if (result.demoUpgraded) {
        setMessage(`Demo mode: upgraded to ${plan}. ${result.message || ''}`);
      }
      const sub = await api.getBillingSubscription();
      setSubscription(sub);
    } catch (err: any) {
      setMessage(err?.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>;
  }

  const currentPlan = subscription?.plan || 'free';
  const planInfo = PLAN_LABELS[currentPlan] || PLAN_LABELS.free;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your subscription and billing information.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">{message}</div>
      )}

      {/* Current Plan */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-medium ${planInfo.color}`}>{planInfo.name}</span>
              {subscription?.status === 'trialing' && (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700">Trial</span>
              )}
              {subscription?.cancelAtPeriodEnd && (
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">Canceling</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {currentPlan === 'free' ? '$0' : currentPlan === 'pro' ? '$29' : '$99'}
            </p>
            <p className="text-sm text-gray-500">/month</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700">Plan features</h3>
          <ul className="mt-2 space-y-1">
            {planInfo.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
        <p className="mt-1 text-sm text-gray-500">Upgrade to unlock more features.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {plans.filter((p: any) => p.id !== currentPlan).map((plan: any) => (
            <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-md">
              <h3 className="text-lg font-bold text-gray-900 capitalize">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold text-gray-900">${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {plan.maxAccounts === -1 ? 'Unlimited' : plan.maxAccounts} social accounts
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {plan.postsPerMonth === -1 ? 'Unlimited' : plan.postsPerMonth} AI posts
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {plan.agents} AI agents
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={upgrading}
                className="mt-6 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
              >
                {upgrading ? 'Upgrading...' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {!process.env.NEXT_PUBLIC_STRIPE_KEY && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
          <strong>Demo mode:</strong> Stripe is not configured. Upgrades apply instantly without payment.
          Set <code className="rounded bg-blue-100 px-1">STRIPE_SECRET_KEY</code> in your .env for real payment processing.
        </div>
      )}
    </div>
  );
}
