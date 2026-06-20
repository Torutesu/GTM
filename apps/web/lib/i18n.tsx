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
