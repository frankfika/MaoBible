import { useEffect, useState, useCallback } from 'react';
import type { LangCode } from '@/types';

const STORAGE_KEY = 'maobible.content-lang';

export function useContentLang(): [LangCode, (l: LangCode) => void] {
  const [lang, setLang] = useState<LangCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    return stored ?? 'zh-CN';
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);
  const update = useCallback((l: LangCode) => setLang(l), []);
  return [lang, update];
}
