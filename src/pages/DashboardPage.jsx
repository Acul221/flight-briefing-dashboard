import { useState } from 'react';
import AirportSelector from '../components/ui/AirportSelector';
import WeatherBox from '../components/ui/WeatherBox';
import StatCard from '../components/ui/StatCard';
import Breadcrumb from '../components/ui/Breadcrumb';
import WindyWidget from '../components/ui/WindyWidget';
import INASIAMWidget from '../components/ui/INASIAMWidget';
import Clock from '../components/ui/Clock';
import BMKGWindTemp from '../components/ui/BMKGWindTemp';

function DashboardPage() {
  const [icao, setIcao] = useState('');

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/' }]} />
      <Clock />
      <WindyWidget />
      <INASIAMWidget />

      {/* Airport Selector terhubung ke state */}
      <AirportSelector selectedIcao={icao} onSelect={setIcao} />

      {/* WeatherBox menerima ICAO */}
      <WeatherBox icao={icao} />

      <BMKGWindTemp />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Flights" value="128" />
        <StatCard title="Delays" value="5" />
        <StatCard title="NOTAMs Active" value="22" />
      </div>
    </div>
  );
}

export default DashboardPage;
