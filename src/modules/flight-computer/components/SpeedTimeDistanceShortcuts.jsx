import { useState } from "react";

export default function SpeedTimeDistanceShortcuts() {
  const [tas, setTas] = useState('');
  const [mach, setMach] = useState('');
  const [distance, setDistance] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('TAS');
  const [showFormula, setShowFormula] = useState(false);

  const nmPerMinFromTAS = () => {
    const t = parseFloat(tas);
    if (isNaN(t)) return '-';
    const rounded = Math.round(t / 10) * 10;
    return ((rounded / 10) / 6).toFixed(2);
  };

  const nmPerMinFromMach = () => {
    const m = parseFloat(mach);
    if (isNaN(m)) return '-';
    return (m * 10).toFixed(2);
  };

  const minutesPerNM = () => {
    const t = parseFloat(tas);
    if (isNaN(t)) return '-';
    return (60 / t).toFixed(2);
  };

  const ete = () => {
    const d = parseFloat(distance);
    const t = parseFloat(tas);
    if (isNaN(d) || isNaN(t)) return '-';
    return (d * (60 / t)).toFixed(2);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        ✈️ Rule of Thumb Estimators: NM/Min, Mach, ETE
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Quick estimation tools for mental math during planning or in-flight operations.
      </p>

      <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
        <li>Estimate NM per minute based on TAS or Mach number.</li>
        <li>Calculate minutes per NM for back-timing or descent.</li>
        <li>Quickly estimate ETE based on distance and TAS.</li>
      </ul>

      <div className="flex gap-2">
        <button
          className={`text-sm px-3 py-1 rounded-full transition ${
            mode === 'TAS'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
          }`}
          onClick={() => setMode('TAS')}
        >
          Mode TAS
        </button>
        <button
          className={`text-sm px-3 py-1 rounded-full transition ${
            mode === 'Mach'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100'
          }`}
          onClick={() => setMode('Mach')}
        >
          Mode Mach
        </button>
      </div>

      {mode === 'TAS' && (
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">TAS (KT)</label>
            <input
              type="number"
              value={tas}
              onChange={(e) => setTas(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Distance (NM)</label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      {mode === 'Mach' && (
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Mach Number</label>
            <input
              type="number"
              value={mach}
              onChange={(e) => setMach(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
        <div><strong>NM/min (from TAS):</strong> {nmPerMinFromTAS()}</div>
        <div><strong>NM/min (from Mach):</strong> {nmPerMinFromMach()}</div>
        <div><strong>Minutes per NM:</strong> {minutesPerNM()}</div>
        <div><strong>ETE (min):</strong> {ete()}</div>
      </div>

      <div className="flex justify-end">
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
            <p><strong>NM/min (TAS)</strong> = (Rounded TAS / 10) ÷ 6</p>
            <p className="text-xs">
              Used to quickly estimate ground coverage per minute based on true airspeed.
            </p>
          </div>
          <div>
            <p><strong>NM/min (Mach)</strong> = Mach × 10</p>
            <p className="text-xs">
              Use during cruise to convert Mach to distance per minute (approximate).
            </p>
          </div>
          <div>
            <p><strong>Minutes per NM</strong> = 60 ÷ TAS</p>
            <p className="text-xs">
              Helpful for calculating how long each mile takes — useful in reverse descent planning.
            </p>
          </div>
          <div>
            <p><strong>ETE</strong> = Distance × Minutes per NM</p>
            <p className="text-xs">
              Used to estimate total enroute time based on current TAS and remaining distance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
