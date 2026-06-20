'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type Locale = 'en' | 'ja';

const translations: Record<Locale, Record<string, string>> = {
  en: {
    'app.name': 'GON',
    'app.tagline': 'AI Marketing Team',
    'nav.dashboard': 'Dashboard',
    'nav.agents': 'AI Agents',
    'nav.posts': 'Posts',
    'nav.analytics': 'Analytics',
    'nav.calendar': 'Calendar',
    'nav.chat': 'Chat',
    'nav.campaigns': 'Campaigns',
    'nav.integrations': 'Integrations',
    'nav.billing': 'Billing',
    'nav.settings': 'Settings',
    'nav.signOut': 'Sign out',
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.create': 'Create',
    'common.edit': 'Edit',
    'common.back': 'Back',
    'common.search': 'Search',
    'lp.features': 'Features',
    'lp.pricing': 'Pricing',
    'lp.signIn': 'Sign In',
    'lp.getStarted': 'Get Started',
    'lp.hero.title1': 'Your entire marketing team,',
    'lp.hero.title2': 'powered by AI',
    'lp.hero.desc': 'GON connects your social accounts, generates content strategies with 8 specialized AI agents, schedules posts, and optimizes performance — all autonomously.',
    'lp.hero.cta': 'Start Free — No Credit Card',
    'lp.hero.seeFeatures': 'See Features',
    'lp.hero.freeNote': 'Free plan includes 5 AI-generated posts and 1 social account',
    'lp.features.title': 'Everything you need to win on social',
    'lp.features.subtitle': 'Eight specialized AI agents working 24/7 to grow your brand',
    'lp.how.title': 'How it works',
    'lp.how.subtitle': 'Three steps to AI-powered marketing',
    'lp.how.step1.title': 'Connect Accounts',
    'lp.how.step1.desc': 'Link X, Instagram, and more with one click. No API keys needed for demo mode.',
    'lp.how.step2.title': 'AI Generates Strategy',
    'lp.how.step2.desc': 'Your 8 AI agents analyze your brand, competitors, and industry to create a content plan.',
    'lp.how.step3.title': 'Publish & Optimize',
    'lp.how.step3.desc': 'Review AI-generated posts, schedule them, and watch engagement grow automatically.',
    'lp.pricing.title': 'Simple, transparent pricing',
    'lp.pricing.subtitle': 'Start free, upgrade when you grow',
    'lp.footer.tagline': 'Autonomous AI-powered marketing platform',
    'lp.footer.copyright': 'All rights reserved.',
    'login.title': 'Sign in',
    'login.welcome': 'Welcome Back',
    'login.welcomeDesc': 'Sign in to continue managing your AI-powered marketing campaigns.',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.noAccount': "Don't have an account?",
    'login.createOne': 'Create one',
    'login.error.fillFields': 'Please fill in all fields',
    'login.error.failed': 'Login failed',
    'register.title': 'Create an account',
    'register.name': 'Full name',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.createAccount': 'Create Account',
    'register.creating': 'Creating account...',
    'register.haveAccount': 'Already have an account?',
    'register.logIn': 'Log in',
    'register.agree': 'I agree to the',
    'register.terms': 'Terms of Service',
    'register.privacy': 'Privacy Policy',
    'register.error.fillFields': 'Please fill in all fields',
    'register.error.passwordLength': 'Password must be at least 8 characters',
    'register.error.agreeTerms': 'You must agree to the Terms of Service',
    'register.error.failed': 'Registration failed',
    'register.hero.title': 'AI-Powered Marketing',
    'register.hero.desc': 'Connect your social accounts, generate content strategies with 8 specialized AI agents, schedule posts, and optimize performance — all autonomously.',
  },
  ja: {
    'app.name': 'GON',
    'app.tagline': 'AIマーケティングチーム',
    'nav.dashboard': 'ダッシュボード',
    'nav.agents': 'AIエージェント',
    'nav.posts': '投稿',
    'nav.analytics': '分析',
    'nav.calendar': 'カレンダー',
    'nav.chat': 'チャット',
    'nav.campaigns': 'キャンペーン',
    'nav.integrations': '連携',
    'nav.billing': '課金',
    'nav.settings': '設定',
    'nav.signOut': 'ログアウト',
    'common.loading': '読み込み中...',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.create': '作成',
    'common.edit': '編集',
    'common.back': '戻る',
    'common.search': '検索',
    'lp.features': '機能',
    'lp.pricing': '料金',
    'lp.signIn': 'ログイン',
    'lp.getStarted': '始める',
    'lp.hero.title1': 'マーケティングチーム全体を、',
    'lp.hero.title2': 'AIが支えます',
    'lp.hero.desc': 'GONはソーシャルアカウントを接続し、8つの専門AIエージェントがコンテンツ戦略を生成、投稿をスケジュールし、パフォーマンスを最適化します。',
    'lp.hero.cta': '無料で始める — クレジットカード不要',
    'lp.hero.seeFeatures': '機能を見る',
    'lp.hero.freeNote': '無料プランには月5件のAI投稿と1つのSNSアカウントが含まれます',
    'lp.features.title': 'ソーシャルで成功するためのすべて',
    'lp.features.subtitle': '8つの専門AIエージェントが24時間365日、ブランドの成長を支援',
    'lp.how.title': '使い方',
    'lp.how.subtitle': 'AIマーケティングの3ステップ',
    'lp.how.step1.title': 'アカウント接続',
    'lp.how.step1.desc': 'X、Instagramなどをワンクリックで連携。デモモードならAPIキー不要。',
    'lp.how.step2.title': 'AIが戦略を生成',
    'lp.how.step2.desc': '8つのAIエージェントがブランド、競合、業界を分析しコンテンツ計画を作成。',
    'lp.how.step3.title': '公開と最適化',
    'lp.how.step3.desc': 'AI生成の投稿を確認し、スケジュール。エンゲージメントが自動的に向上。',
    'lp.pricing.title': 'シンプルで透明な料金',
    'lp.pricing.subtitle': '無料から始めて、成長に合わせてアップグレード',
    'lp.footer.tagline': '自律型AIマーケティングプラットフォーム',
    'lp.footer.copyright': 'All rights reserved.',
    'login.title': 'ログイン',
    'login.welcome': 'おかえりなさい',
    'login.welcomeDesc': 'AIマーケティングキャンペーンの管理を続けましょう。',
    'login.email': 'メールアドレス',
    'login.password': 'パスワード',
    'login.signIn': 'ログイン',
    'login.signingIn': 'ログイン中...',
    'login.noAccount': 'アカウントをお持ちでないですか？',
    'login.createOne': '作成する',
    'login.error.fillFields': 'すべての項目を入力してください',
    'login.error.failed': 'ログインに失敗しました',
    'register.title': 'アカウント作成',
    'register.name': '氏名',
    'register.email': 'メールアドレス',
    'register.password': 'パスワード',
    'register.createAccount': 'アカウント作成',
    'register.creating': '作成中...',
    'register.haveAccount': 'すでにアカウントをお持ちですか？',
    'register.logIn': 'ログイン',
    'register.agree': '同意します',
    'register.terms': '利用規約',
    'register.privacy': 'プライバシーポリシー',
    'register.error.fillFields': 'すべての項目を入力してください',
    'register.error.passwordLength': 'パスワードは8文字以上必要です',
    'register.error.agreeTerms': '利用規約に同意してください',
    'register.error.failed': '登録に失敗しました',
    'register.hero.title': 'AI搭載マーケティング',
    'register.hero.desc': 'ソーシャルアカウントを接続し、8つの専門AIエージェントがコンテンツ戦略を生成、投稿をスケジュールし、パフォーマンスを最適化します。',
  },
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = 'gon_locale';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === 'en' || saved === 'ja') {
      setLocale(saved);
    }
  }, []);

  const setAndPersistLocale = useCallback((next: Locale) => {
    setLocale(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback((key: string) => {
    return translations[locale]?.[key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale: setAndPersistLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
