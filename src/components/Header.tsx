import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
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
          毛选
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
