import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';

/**
 * Minimal header — just app name + theme toggle. No nav, no links.
 * Navigation lives in the bottom tab bar (see AppShell).
 */
export function Header() {
  const { t } = useTranslation();
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md bg-paper/80 dark:bg-dark-paper/80
                 border-b border-ink/5 dark:border-dark-line"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-8 h-12 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif-cn text-base font-medium text-ink dark:text-dark-ink"
        >
          {t('app.name')}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
