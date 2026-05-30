import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import Competitions from './pages/Competitions';
import Giveaway from './pages/Giveaway';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/competitions" element={<Competitions />} />
        <Route path="/competition/:id" element={<Giveaway />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
