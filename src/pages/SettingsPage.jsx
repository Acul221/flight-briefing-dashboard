import Breadcrumb from '../components/ui/Breadcrumb';
import { useState } from 'react';
import QuizEditorMaster from './QuizEditorMaster';

function SettingsPage() {
  const [openEditor, setOpenEditor] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: 'Dashboard', to: '/' },
        { label: 'Settings' }
      ]} />

      {/* Content Settings */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Settings</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Here you can configure your profile, preferences, and application settings.
        </p>
      </div>

      {/* Quiz Editor Accordion */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <button
          className="w-full text-left font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => setOpenEditor(!openEditor)}
        >
          {openEditor ? '▼ Hide Quiz Editor' : '▶ Show Quiz Editor'}
        </button>

        {openEditor && (
          <div className="mt-4 border-t pt-4">
            <QuizEditorMaster />
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
