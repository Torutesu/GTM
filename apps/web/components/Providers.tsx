'use client';

import { useEffect } from 'react';
import { AuthProvider } from '../hooks/useAuth';
import { I18nProvider, useI18n } from '../lib/i18n';

function HtmlLangUpdater() {
  const { locale } = useI18n();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <I18nProvider>
        <HtmlLangUpdater />
        {children}
      </I18nProvider>
    </AuthProvider>
  );
}
