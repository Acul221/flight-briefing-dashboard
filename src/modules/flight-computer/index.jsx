import FlightComputerLayout from './components/FlightComputerLayout';

export default function FlightComputerPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        🧮 Pilot Flight Computer
      </h1>
      <FlightComputerLayout />
    </div>
  );
}
