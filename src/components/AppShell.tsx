import { Outlet, NavLink } from 'react-router-dom';
import { Header } from './Header';

const TABS: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: '书架', icon: '📚', end: true },
  { to: '/ai', label: '解读', icon: '🤖' },
  { to: '/discover', label: '发现', icon: '🔍' },
  { to: '/me', label: '我', icon: '👤' },
];

export function AppShell() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-paper/92 dark:bg-dark-paper/92
                 border-t border-ink/8 dark:border-dark-line
                 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-3xl mx-auto h-14 grid grid-cols-4">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-0.5 transition-colors duration-180 min-h-[44px]',
                isActive
                  ? 'text-cinnabar'
                  : 'text-ink/55 dark:text-dark-ink/55 hover:text-ink dark:hover:text-dark-ink',
              ].join(' ')
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span className="text-[10px] font-medium leading-none mt-0.5">
              {tab.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
