import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function AppShell() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="py-8 text-center text-xs text-secondary dark:text-dark-secondary">
        <div className="prose-reader">
          MaoBible · 原文公开,译文以公版为底
        </div>
      </footer>
    </div>
  );
}
