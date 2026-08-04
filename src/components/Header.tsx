import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header
      className="relative z-30 shrink-0 pt-[env(safe-area-inset-top)]
                 backdrop-blur-xl bg-paper/88 dark:bg-dark-paper/88
                 border-b border-ink/5 dark:border-dark-line"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-8 h-12 flex items-center justify-between">
        <Link
          to="/"
          className="group inline-flex min-h-[44px] items-center gap-2 font-serif-cn text-[15px] font-medium
                     text-ink dark:text-dark-ink touch-manipulation"
          aria-label="毛选 · 返回书架"
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-full border border-cinnabar/35
                       bg-cinnabar/[0.06] text-sm text-cinnabar transition-colors
                       group-hover:bg-cinnabar/10"
            aria-hidden
          >
            毛
          </span>
          <span>毛选</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
