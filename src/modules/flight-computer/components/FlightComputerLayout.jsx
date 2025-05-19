import { useState } from 'react';

// NAV Modules
import TimeDistanceCalculator from './TimeDistanceCalculator';
import SpeedTimeDistanceShortcuts from './SpeedTimeDistanceShortcuts';
import ETPCalculator from './ETPCalculator';
import PNRCalculator from './PNRCalculator';
import PSRCalculator from './PSRCalculator';
import VisualDescentPlanner from './VisualDescentPlanner';

// OPS Modules
import ClimbGradientCalculator from './ClimbGradientCalculator';

// FUEL Modules
import FuelCalculator from './FuelCalculator';

const tabs = ['NAV', 'OPS', 'FUEL', 'UTILS'];

export default function FlightComputerLayout() {
  const [activeTab, setActiveTab] = useState('NAV');

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap justify-center">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${activeTab === tab
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeTab === 'NAV' && (
          <>
            <VisualDescentPlanner />
            <TimeDistanceCalculator />
            <SpeedTimeDistanceShortcuts />
            <ETPCalculator />
            <PNRCalculator />
            <PSRCalculator />
          </>
        )}

        {activeTab === 'OPS' && (
          <>
            <ClimbGradientCalculator />
          </>
        )}

        {activeTab === 'FUEL' && (
          <>
            <FuelCalculator />
          </>
        )}

        {activeTab === 'UTILS' && (
          <div className="text-gray-600 dark:text-gray-400">
            Coming soon: Unit Converter, Zulu Clock, and Memory Tools.
          </div>
        )}
      </div>
    </div>
  );
}
