import { useState } from 'react';
import Breadcrumb from '../components/ui/Breadcrumb';
import WeatherSummary from '../components/ui/WeatherSummary';
import ClockLocal from '../components/ui/ClockLocal';
import ClockUTC from '../components/ui/ClockUTC';
import RACSnapshotWidget from '../components/ui/RACSnapshotWidget';
import NewsWidget from '../components/NewsWidget';
import CompactWxAlert from '../components/ui/CompactWxAlert';
import WindyWidget from '../components/ui/WindyWidget';
import INASIAMWidget from '../components/ui/INASIAMWidget';
import SectionTitle from '../components/ui/SectionTitle';
import CZIBWidget from '../components/ui/CZIBWidget'; // ⬅️ Tambahkan ini

function DashboardPage() {
  const [showWidgets, setShowWidgets] = useState(true);

  return (
    <div className="p-6 space-y-10 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Dashboard', to: '/' }]} />

      {/* News & Alerts */}
      <div>
        <SectionTitle icon="📰" title="Information & Alerts" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewsWidget />
          <CompactWxAlert />
        </div>
      </div>

      {/* CZIB Alerts */}
      <div>
        <CZIBWidget />
      </div>

      {/* Clock & Ramp Tools */}
      <div>
        <SectionTitle icon="🕒" title="Time & Ramp Tools" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ClockLocal />
          <ClockUTC />
          <RACSnapshotWidget />
        </div>
      </div>

      {/* AI Weather Summary */}
      <div>
        <SectionTitle icon="🌦️" title="Weather Summary & AI Briefing" />
        <WeatherSummary />
      </div>

      {/* Weather Widgets with Toggle */}
      <div>
        <SectionTitle icon="📡" title="Weather Widgets" />
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowWidgets(!showWidgets)}
            className="text-sm px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {showWidgets ? '▾ Hide Widgets' : '▸ Show Widgets'}
          </button>
        </div>

        {showWidgets && (
          <div className="space-y-6">
            <WindyWidget />
            <INASIAMWidget />
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
