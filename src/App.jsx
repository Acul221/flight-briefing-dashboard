import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// ⏳ Lazy import pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DelayPage = lazy(() => import("./pages/Delay"));
const TimeTools = lazy(() => import("@/pages/TimeTools"));
const DisclaimerPage = lazy(() => import("@/pages/DisclaimerPage"));
const FlightComputerPage = lazy(() => import("@/modules/flight-computer"));
const OcrTestPage = lazy(() => import("./pages/OcrTestPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const QuizSelector = lazy(() => import("./pages/QuizSelector"));
const SubjectSelector = lazy(() => import("./pages/SubjectSelector"));
const QuizEditorMaster = lazy(() => import("./pages/QuizEditorMaster"));
const OcrPage = lazy(() => import("./pages/OcrPage"));
const RoiTester = lazy(() => import("./pages/RoiTester"));
const LogbookPrint = lazy(() => import("./pages/LogbookPrint"));

export default function App() {
  return (
    // Suspense untuk fallback loading
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <Routes>
        {/* Landing */}
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
        <Route path="/ocr-test" element={<OcrTestPage />} />
        <Route path="/roi-tester" element={<RoiTester />} />

        {/* Print view */}
        <Route path="/print" element={<LogbookPrint />} />

        {/* Fallback */}
        <Route path="*" element={<MainLayout><DashboardPage /></MainLayout>} />
      </Routes>
    </Suspense>
  );
}
