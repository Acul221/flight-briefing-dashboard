import { useState } from 'react';
import AirportSelector from '../components/ui/AirportSelector';
import WeatherBox from '../components/ui/WeatherBox';
import StatCard from '../components/ui/StatCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import WindyWidget from '../components/ui/WindyWidget';
import INASIAMWidget from '../components/ui/INASIAMWidget';
import Clock from '../components/ui/Clock';
import BMKGWindTemp from '../components/ui/BMKGWindTemp';
import RACSnapshotWidget from '../components/ui/RACSnapshotWidget';
import NewsWidget from '../components/NewsWidget';
import ClockLocal from '../components/ui/ClockLocal';
import ClockUTC from '../components/ui/ClockUTC';

function DashboardPage() {
  const [icao, setIcao] = useState('');

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/' }]} />

      {/* NEWS WIDGET - Full Width */}
      <NewsWidget />

      {/* GRID WIDGETS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ClockLocal />
        <ClockUTC />
        <RACSnapshotWidget />
      </div>

      {/* CUACA & TOOLS */}
      <AirportSelector onSelect={setIcao} />
      <WeatherBox icao={icao} />
      <WindyWidget />
      <INASIAMWidget />
      <BMKGWindTemp />
    </div>
  );
}

export default DashboardPage;
