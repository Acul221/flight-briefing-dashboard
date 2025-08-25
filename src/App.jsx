import React from "react";
import { Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import DelayPage from "./pages/Delay";
import TimeTools from "@/pages/TimeTools";
import DisclaimerPage from "@/pages/DisclaimerPage";
import FlightComputerPage from "@/modules/flight-computer";

import QuizPage from "./pages/QuizPage";
import QuizSelector from "./pages/QuizSelector";
import SubjectSelector from "./pages/SubjectSelector";
import QuizEditorMaster from "./pages/QuizEditorMaster";

// OCR
import OcrPage from "./pages/OcrPage";
import LogbookPrint from "./pages/LogbookPrint";

export default function App() {
  return (
    <Routes>
      {/* Landing tanpa layout */}
      <Route path="/" element={<DisclaimerPage />} />

      {/* Quiz */}
      <Route path="/quiz" element={<MainLayout><QuizSelector /></MainLayout>} />
      <Route path="/quiz/:aircraft" element={<MainLayout><SubjectSelector /></MainLayout>} />
      <Route path="/quiz/:aircraft/:subject" element={<MainLayout><QuizPage /></MainLayout>} />
      <Route path="/quiz-editor" element={<MainLayout><QuizEditorMaster /></MainLayout>} />

      {/* Pages with layout */}
      <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
      <Route path="/rac-delay" element={<MainLayout><DelayPage /></MainLayout>} />
      <Route path="/settings" element={<MainLayout><SettingsPage /></MainLayout>} />
      <Route path="/time-tools" element={<MainLayout><TimeTools /></MainLayout>} />
      <Route path="/flight-computer" element={<MainLayout><FlightComputerPage /></MainLayout>} />

      {/* OCR routes */}
      <Route path="/ocr" element={<MainLayout><OcrPage /></MainLayout>} />
      {/* Print biasanya tanpa layout agar bersih untuk PDF */}
      <Route path="/print" element={<LogbookPrint />} />

      {/* 404 fallback (opsional) */}
      <Route path="*" element={<MainLayout><DashboardPage /></MainLayout>} />
    </Routes>
  );
}
