import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

/**
 * Cycle: light → dark → system → light
 * Compact button for the header; shows the next-mode icon.
 */
export function ThemeToggle() {
  const [mode, setMode] = useTheme();
  const { t } = useTranslation();
  const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';
  const label =
    mode === 'light'
      ? t('theme.light')
      : mode === 'dark'
      ? t('theme.dark')
      : t('theme.system');

  return (
    <button
      type="button"
      aria-label={`${t('nav.theme')}: ${label}`}
      title={`${t('nav.theme')}: ${label}`}
      onClick={() => setMode(next)}
      className="min-h-[44px] min-w-[44px] rounded-card px-3 py-1.5 text-sm border border-ink/10 dark:border-dark-line
                 bg-white/40 dark:bg-dark-ink/5 hover:bg-ink/5 dark:hover:bg-dark-ink/10
                 transition-colors duration-180"
    >
      {mode === 'light' ? '☀' : mode === 'dark' ? '☾' : '◐'} <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
