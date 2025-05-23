import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import DelayPage from "./pages/Delay";
import TimeTools from "@/pages/TimeTools";
import DisclaimerPage from "@/pages/DisclaimerPage";
import FlightComputerPage from "@/modules/flight-computer"; // ⬅️ Import baru
import React from "react";
import QuizPage from "./pages/QuizPage";
import QuizSelector from "./pages/QuizSelector";
import SubjectSelector from "./pages/SubjectSelector";
import QuizEditorICAO from "./pages/QuizEditorICAO";


function App() {
  return (
    <Routes>
      {/* Tambahkan route quiz di sini */}
      <Route path="/quiz" element={<MainLayout><QuizSelector /></MainLayout>} />
      <Route path="/quiz/:aircraft" element={<MainLayout><SubjectSelector /></MainLayout>} />
      <Route path="/quiz/:aircraft/:subject" element={<MainLayout><QuizPage /></MainLayout>} />
      <Route path="/quiz-editor/icao" element={<MainLayout><QuizEditorICAO /></MainLayout>} />

      {/* Landing page tanpa layout */}
      <Route path="/" element={<DisclaimerPage />} />

      {/* Pages with layout */}
      <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
      <Route path="/rac-delay" element={<MainLayout><DelayPage /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
      <Route path="/time-tools" element={<MainLayout><TimeTools /></MainLayout>} />
      <Route path="/flight-computer" element={<MainLayout><FlightComputerPage /></MainLayout>} /> {/* ⬅️ Route baru */}
    </Routes>
  );
}

export default App;
