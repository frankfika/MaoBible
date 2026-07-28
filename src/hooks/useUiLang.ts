import { useCallback, useEffect, useState } from 'react';
import i18n from '@/i18n';
import type { LangCode } from '@/types';

const STORAGE_KEY = 'maobible.ui-lang';

/**
 * UI-language hook — bridges i18next's current language with localStorage
 * persistence. Mirrors the shape of useContentLang so the two toggles feel
 * identical in the UI.
 *
 * The i18n bootstrap reads localStorage at startup; this hook keeps the
 * stored value in sync after the user changes language in Settings.
 */
export function useUiLang(): [LangCode, (l: LangCode) => void] {
  const [lang, setLang] = useState<LangCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored === 'zh-CN' || stored === 'en') return stored;
    return (i18n.language as LangCode) ?? 'zh-CN';
  });

  useEffect(() => {
    // Make sure i18n reflects the localStorage value on first mount.
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [lang]);

  const update = useCallback((l: LangCode) => {
    setLang(l);
    localStorage.setItem(STORAGE_KEY, l);
    void i18n.changeLanguage(l);
  }, []);

  return [lang, update];
}
