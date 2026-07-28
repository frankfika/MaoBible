import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', key: 'today' },
  { to: '/library', key: 'library' },
  { to: '/explore', key: 'explore' },
  { to: '/me', key: 'me' },
] as const;

export function Header() {
  const { t } = useTranslation();
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md bg-paper/80 dark:bg-dark-paper/80
                 border-b border-ink/5 dark:border-dark-line"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif-cn text-lg font-medium text-ink dark:text-dark-ink"
        >
          {t('app.name')}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          {NAV_ITEMS.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                [
                  'px-2 sm:px-3 py-1.5 text-sm rounded transition-colors duration-180',
                  isActive
                    ? 'text-cinnabar font-medium'
                    : 'text-ink/70 dark:text-dark-ink/70 hover:text-ink dark:hover:text-dark-ink',
                ].join(' ')
              }
            >
              {t(`nav.${n.key}`)}
            </NavLink>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
