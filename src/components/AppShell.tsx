import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';

// useTranslation referenced in BottomNav; keep the import live.
void useTranslation;

/**
 * App shell — minimal chrome: header (app name + theme toggle) + bottom tab bar.
 * Three tabs: Browse / Ask / Settings (settings is just the theme toggle area,
 * or future preferences).
 */
export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

const TABS = [
  { to: '/', key: 'browse', label: 'Browse', icon: '📖' },
  { to: '/ask', key: 'ask', label: 'Ask', icon: '🔍' },
  { to: '/me', key: 'me', label: 'Me', icon: '☰' },
] as const;

function BottomNav() {
  const { t } = useTranslation();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-paper/90 dark:bg-dark-paper/90
                 border-t border-ink/5 dark:border-dark-line"
    >
      <div className="max-w-3xl mx-auto h-14 grid grid-cols-3">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-0.5 transition-colors duration-180',
                isActive
                  ? 'text-cinnabar'
                  : 'text-ink/60 dark:text-dark-ink/60 hover:text-ink dark:hover:text-dark-ink',
              ].join(' ')
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium leading-none">
              {t(`nav.${tab.key}`)}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
