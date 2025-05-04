// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import DelayPage from './pages/Delay'; // ← Import halaman RAC Delay

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout><DashboardPage /></MainLayout>} />
      <Route path="/rac-delay" element={<MainLayout><DelayPage /></MainLayout>} /> {/* ← Tambahkan ini */}
      <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
    </Routes>
  );
}

export default App;
