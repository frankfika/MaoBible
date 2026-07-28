import { useEffect, useState, useCallback } from 'react';

type Mode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'maobible.theme';

function applyTheme(mode: Mode) {
  const isDark =
    mode === 'dark' ||
    (mode === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? '#191918' : '#F4F1EA');
}

export function useTheme(): [Mode, (m: Mode) => void] {
  const [mode, setMode] = useState<Mode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
    return stored ?? 'system';
  });

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // React to system changes when in "system" mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const update = useCallback((m: Mode) => setMode(m), []);
  return [mode, update];
}
