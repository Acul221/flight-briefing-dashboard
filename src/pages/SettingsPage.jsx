import { useState } from "react";
import Breadcrumb from "../components/ui/Breadcrumb";
import QuizEditorMaster from "./QuizEditorMaster";
import PasteNotamForm from "../components/PasteNotamForm";

function SettingsPage() {
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showNotamUploader, setShowNotamUploader] = useState(false);

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
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
          Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          Configure your preferences, upload tools, and experiment with internal modules.
        </p>
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
            <QuizEditorMaster />  {/* ✅ Fixed */}
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
    </div>
  );
}

export default SettingsPage;
