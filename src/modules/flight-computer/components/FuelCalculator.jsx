import { useState } from "react";

export default function FuelCalculator() {
  const [fuel, setFuel] = useState('');
  const [burnRate, setBurnRate] = useState('');
  const [distanceFlown, setDistanceFlown] = useState('');
  const [distanceToGo, setDistanceToGo] = useState('');
  const [timeEnroute, setTimeEnroute] = useState('');
  const [unit, setUnit] = useState('kg');
  const [showFormula, setShowFormula] = useState(false);

  const parse = (val) => parseFloat(val) || 0;

  const enduranceHr = parse(fuel) / parse(burnRate);
  const enduranceMin = enduranceHr * 60;

  const formattedEndurance = () => {
    const hrs = Math.floor(enduranceMin / 60);
    const mins = Math.round(enduranceMin % 60);
    return `${hrs}h ${mins}m`;
  };

  const timeRemaining = () => {
    const d = parse(distanceToGo);
    const b = parse(distanceFlown);
    const total = d + b;
    const speedEstimate = total > 0 && parse(timeEnroute) > 0
      ? total / (parse(timeEnroute) / 60)
      : 0;
    const timeLeftMin = d / (speedEstimate || 1) * 60;
    const hrs = Math.floor(timeLeftMin / 60);
    const mins = Math.round(timeLeftMin % 60);
    return isNaN(timeLeftMin) ? '-' : `${hrs}h ${mins}m`;
  };

  const fuelRequired = () => {
    const t = parse(timeEnroute);
    const r = parse(burnRate);
    return (t / 60 * r).toFixed(1);
  };

  const fuelEfficiency = () => {
    const dist = parse(distanceFlown);
    const used = parse(timeEnroute) / 60 * parse(burnRate);
    return used > 0 ? (dist / used).toFixed(2) : '-';
  };

  const handleClear = () => {
    setFuel('');
    setBurnRate('');
    setDistanceFlown('');
    setDistanceToGo('');
    setTimeEnroute('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        ⛽ Fuel & Endurance Calculator
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Estimate endurance, fuel needs, and fuel efficiency based on remaining fuel and flight data.
      </p>

      <div className="flex gap-2">
        <button
          className={`text-sm px-3 py-1 rounded-full transition ${
            unit === 'kg'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
          }`}
          onClick={() => setUnit('kg')}
        >
          kg
        </button>
        <button
          className={`text-sm px-3 py-1 rounded-full transition ${
            unit === 'lbs'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
          }`}
          onClick={() => setUnit('lbs')}
        >
          lbs
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Fuel Available ({unit})</label>
          <input
            type="number"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Burn Rate ({unit}/hr)</label>
          <input
            type="number"
            value={burnRate}
            onChange={(e) => setBurnRate(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Distance Flown (NM)</label>
          <input
            type="number"
            value={distanceFlown}
            onChange={(e) => setDistanceFlown(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Distance to Go (NM)</label>
          <input
            type="number"
            value={distanceToGo}
            onChange={(e) => setDistanceToGo(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Planned Time Enroute (min)</label>
          <input
            type="number"
            value={timeEnroute}
            onChange={(e) => setTimeEnroute(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
        <div><strong>Endurance:</strong> {formattedEndurance()}</div>
        <div><strong>Time Remaining:</strong> {timeRemaining()}</div>
        <div><strong>Fuel Required:</strong> {fuelRequired()} {unit}</div>
        <div><strong>NM per {unit}:</strong> {fuelEfficiency()}</div>
      </div>

      <div className="flex justify-between mt-4">
        <button
          onClick={handleClear}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Clear
        </button>
        <button
          onClick={() => setShowFormula(!showFormula)}
          className="text-sm text-blue-600 dark:text-blue-400 underline"
        >
          {showFormula ? 'Hide Formula' : 'Show Formula'}
        </button>
      </div>

      {showFormula && (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-3 mt-2">
          <div>
            <p><strong>Endurance</strong> = Fuel / Burn Rate</p>
            <p className="text-xs">Gives total flight time available at current fuel burn.</p>
          </div>
          <div>
            <p><strong>Fuel Required</strong> = Time Enroute × Burn Rate</p>
            <p className="text-xs">Useful for planning and cross-checking sufficiency.</p>
          </div>
          <div>
            <p><strong>NM per Unit</strong> = Distance Flown / Fuel Used</p>
            <p className="text-xs">Indicates aircraft fuel efficiency over current leg.</p>
          </div>
        </div>
      )}
    </div>
  );
}
