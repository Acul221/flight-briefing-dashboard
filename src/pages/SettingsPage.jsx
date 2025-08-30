// src/pages/SettingsPage.jsx
import { useState, Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb";
import QuizEditorMaster from "./QuizEditorMaster";
import PasteNotamForm from "../components/PasteNotamForm";

// Lazy import untuk admin RAC settings
const AdminRACSettings = lazy(() => import("./admin/AdminRACSettings.jsx"));

function SettingsPage() {
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showNotamUploader, setShowNotamUploader] = useState(false);
  const [showRoiTester, setShowRoiTester] = useState(false);
  const [showRacSettings, setShowRacSettings] = useState(true);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", to: "/" },
          { label: "Settings" },
        ]}
      />

      {/* Settings Intro */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Settings
          </h2>
          <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            Admin Area
          </span>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-300 text-sm">
          Configure your preferences, upload tools, and internal modules. RAC thresholds & offsets apply to the delay monitor.
        </p>
      </div>

      {/* RAC Settings (Admin) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <button
          onClick={() => setShowRacSettings(!showRacSettings)}
          className="w-full text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showRacSettings ? "▼ Hide RAC Settings" : "▶ Show RAC Settings"}
        </button>

        {showRacSettings && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Atur <em>Deviation Thresholds</em> (warna) & <em>Offsets</em> per checkpoint. Perubahan di sini langsung dipakai di <code>RACDelayPage</code>.
            </p>
            <Suspense fallback={<div className="text-sm text-gray-500">Loading RAC Settings…</div>}>
              <AdminRACSettings />
            </Suspense>
          </div>
        )}
      </div>

      {/* Quiz Editor Accordion */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <button
          onClick={() => setShowQuizEditor(!showQuizEditor)}
          className="w-full text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showQuizEditor ? "▼ Hide Quiz Editor" : "▶ Show Quiz Editor"}
        </button>

        {showQuizEditor && (
          <div className="mt-4 border-t pt-4">
            <QuizEditorMaster />
          </div>
        )}
      </div>

      {/* NOTAM Upload Accordion */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <button
          onClick={() => setShowNotamUploader(!showNotamUploader)}
          className="w-full text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showNotamUploader ? "▼ Hide NOTAM Uploader" : "▶ Show NOTAM Uploader"}
        </button>

        {showNotamUploader && (
          <div className="mt-4 border-t pt-4">
            <PasteNotamForm />
          </div>
        )}
      </div>

      {/* ROI Tester Accordion */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <button
          onClick={() => setShowRoiTester(!showRoiTester)}
          className="w-full text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showRoiTester ? "▼ Hide ROI Tester" : "▶ Show ROI Tester"}
        </button>

        {showRoiTester && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Open ROI Tester to adjust OCR scan areas.
            </p>
            <Link
              to="/roi-tester"
              className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Open ROI Tester
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
