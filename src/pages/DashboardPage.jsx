// src/pages/DashboardPage.jsx
import AirportSelector from '../components/ui/AirportSelector';
import WeatherBox from '../components/ui/WeatherBox';
import StatCard from '../components/ui/StatCard';
import Breadcrumb from '../components/ui/Breadcrumb'; // ✅ Tambahkan import Breadcrumb
import WindyWidget from '../components/ui/WindyWidget';
import INASIAMWidget from '../components/ui/INASIAMWidget';
import Clock from '../components/ui/Clock';

function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        { label: 'Dashboard', to: '/' }
      ]} />
      
      {/* Clock */}
      <Clock />

      {/* WindyWidget */}
      <WindyWidget />

      {/* WindyWidget */}
      <INASIAMWidget />

      {/* Airport Selector */}
      <AirportSelector />

      {/* Weather Box */}
      <WeatherBox />

      {/* Statistik Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Flights" value="128" />
        <StatCard title="Delays" value="5" />
        <StatCard title="NOTAMs Active" value="22" />
      </div>
    </div>
  );
}

export default DashboardPage;
