import { Routes, Route } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Today } from './pages/Today';
import { Library } from './pages/Library';
import { Reader } from './pages/Reader';
import { Me } from './pages/Me';
import { Explore } from './pages/Explore';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Today />} />
        <Route path="/library" element={<Library />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/read/:id" element={<Reader />} />
        <Route path="/me" element={<Me />} />
        <Route path="*" element={<Library />} />
      </Route>
    </Routes>
  );
}
