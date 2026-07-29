import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Shelf } from './pages/Shelf';
import { Discover } from './pages/Discover';
import { AI } from './pages/AI';
import { Me } from './pages/Me';
import { Reader } from './pages/Reader';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Shelf />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/me" element={<Me />} />
        <Route path="/read/:id" element={<Reader />} />
        <Route path="*" element={<Shelf />} />
      </Route>
    </Routes>
  );
}
