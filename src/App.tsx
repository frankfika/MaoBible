import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Feed } from './pages/Feed';
import { Reader } from './pages/Reader';
import { Ask } from './pages/Ask';
import { Me } from './pages/Me';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Feed />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/me" element={<Me />} />
        <Route path="/read/:id" element={<Reader />} />
        <Route path="*" element={<Feed />} />
      </Route>
    </Routes>
  );
}
