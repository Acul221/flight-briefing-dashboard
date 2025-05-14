import { useState, useEffect } from 'react';

export default function TimeDistanceCalculator() {
  const [distance, setDistance] = useState('');
  const [groundSpeed, setGroundSpeed] = useState('');
  const [time, setTime] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [showFormula, setShowFormula] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tdc-inputs'));
    if (saved) {
      setDistance(saved.distance || '');
      setGroundSpeed(saved.groundSpeed || '');
      setTime(saved.time || '');
      setTimeUnit(saved.timeUnit || 'minutes');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      'tdc-inputs',
      JSON.stringify({ distance, groundSpeed, time, timeUnit })
    );
  }, [distance, groundSpeed, time, timeUnit]);

  const convertToHours = (value) => (timeUnit === 'minutes' ? value / 60 : value);
  const convertToMinutes = (value) => (timeUnit === 'minutes' ? value : value * 60);

  useEffect(() => {
    const d = parseFloat(distance);
    const gs = parseFloat(groundSpeed);
    const t = convertToHours(parseFloat(time));

    if (!isNaN(d) && !isNaN(gs) && isNaN(t)) {
      setTime((d / gs).toFixed(2));
    } else if (!isNaN(d) && isNaN(gs) && !isNaN(t)) {
      setGroundSpeed((d / t).toFixed(2));
    } else if (isNaN(d) && !isNaN(gs) && !isNaN(t)) {
      setDistance((gs * t).toFixed(2));
    }
  }, [distance, groundSpeed, time, timeUnit]);

  const handleClear = () => {
    setDistance('');
    setGroundSpeed('');
    setTime('');
    localStorage.removeItem('tdc-inputs');
  };

  const formattedTime = () => {
    const t = parseFloat(time);
    if (isNaN(t)) return '-';
    const timeInHours = convertToHours(t);
    const timeInMinutes = convertToMinutes(t);
    return `${timeInHours.toFixed(2)} hr / ${Math.round(timeInMinutes)} min`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
        🧭 Time, Distance, and Ground Speed Calculator
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Quickly calculate either distance, time, or ground speed when two of the variables are known.
        Useful during navigation planning, in-flight checks, or when estimating travel time.
      </p>

      <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
        <li>Estimate how far you can travel in a given time at a specific speed.</li>
        <li>Calculate time enroute based on distance and ground speed.</li>
        <li>Find your actual ground speed using distance flown and time elapsed.</li>
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Distance (NM)
          </label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ground Speed (KTS)
          </label>
          <input
            type="number"
            value={groundSpeed}
            onChange={(e) => setGroundSpeed(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Time ({timeUnit === 'minutes' ? 'Minutes' : 'Hours'})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={() =>
                setTimeUnit(timeUnit === 'minutes' ? 'hours' : 'minutes')
              }
              className="text-xs bg-gray-200 dark:bg-gray-600 px-2 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              ⇄ {timeUnit === 'minutes' ? 'Switch to Hours' : 'Switch to Minutes'}
            </button>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-800 dark:text-gray-200">
        <strong>Computed Time:</strong> {formattedTime()}
      </div>

      <div className="flex items-center justify-between mt-4">
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
            <p><strong>Distance</strong> = Ground Speed × Time</p>
            <p className="text-xs">
              Use this to find how far you can fly in a given time at a certain speed.
            </p>
          </div>
          <div>
            <p><strong>Time</strong> = Distance ÷ Ground Speed</p>
            <p className="text-xs">
              Use this when you know the distance and speed and want to know time enroute.
            </p>
          </div>
          <div>
            <p><strong>Ground Speed</strong> = Distance ÷ Time</p>
            <p className="text-xs">
              Use this to check actual speed from flight time and logged distance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
