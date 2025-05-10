import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import DelayPage from "./pages/Delay"; // RAC Delay
import TimeTools from "@/pages/TimeTools"; // Time Tools

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout><DashboardPage /></MainLayout>} />
      <Route path="/rac-delay" element={<MainLayout><DelayPage /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
      <Route path="/time-tools" element={<MainLayout><TimeTools /></MainLayout>} />
    </Routes>
  );
}

export default App;
