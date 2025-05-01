// src/pages/SettingsPage.jsx
import Breadcrumb from '../components/ui/Breadcrumb';

function SettingsPage() {
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
    </div>
  );
}

export default SettingsPage;
