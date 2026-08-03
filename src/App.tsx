import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';

// Route-level code splitting — was a single 424k index chunk. The Reader
// is the heaviest page (AI dialog, haptics, share, framer-motion) so it
// only loads when the user actually opens an article. Shelf / Ask / Me
// stay eager because they are reachable from the bottom nav on first
// paint.
const Shelf = lazy(() => import('./pages/Shelf').then((m) => ({ default: m.Shelf })));
const Ask = lazy(() => import('./pages/Ask').then((m) => ({ default: m.Ask })));
const Me = lazy(() => import('./pages/Me').then((m) => ({ default: m.Me })));
const Reader = lazy(() => import('./pages/Reader').then((m) => ({ default: m.Reader })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));

function PageFallback() {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 text-secondary text-sm">
      加载中…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Shelf />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/me" element={<Me />} />
          <Route path="/read/:id" element={<Reader />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<Shelf />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
