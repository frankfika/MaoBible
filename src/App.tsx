import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Shelf } from './pages/Shelf';
import { Ask } from './pages/Ask';
import { Me } from './pages/Me';
import { Reader } from './pages/Reader';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Shelf />} />
        <Route path="/ask" element={<Ask />} />
        <Route path="/me" element={<Me />} />
        <Route path="/read/:id" element={<Reader />} />
        <Route path="*" element={<Shelf />} />
      </Route>
    </Routes>
  );
}
