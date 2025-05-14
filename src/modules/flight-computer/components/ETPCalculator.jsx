import { useState } from "react";

export default function ETPCalculator() {
  const [distance, setDistance] = useState('');
  const [tas, setTas] = useState('');
  const [windComponent, setWindComponent] = useState('');
  const [showFormula, setShowFormula] = useState(false);

  const parse = (v) => parseFloat(v) || 0;

  const continueGS = parse(tas) + parse(windComponent);
  const returnGS = parse(tas) - parse(windComponent);

  const etpNM = () => {
    const total = parse(distance);
    const gsCont = continueGS;
    const gsReturn = returnGS;
    const result = (total * gsReturn) / (gsCont + gsReturn);
    return isFinite(result) ? result.toFixed(1) : '-';
  };

  const etpTime = () => {
    const d = parse(etpNM());
    const gs = continueGS;
    if (!isFinite(d) || !gs || gs <= 0) return '-';
    const timeDecimal = d / gs;
    const hh = Math.floor(timeDecimal);
    const mm = Math.round((timeDecimal - hh) * 60);
    return `${hh}h ${mm}m (${timeDecimal.toFixed(2)} hr)`;
  };

  const handleClear = () => {
    setDistance('');
    setTas('');
    setWindComponent('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        📍 Equal Time Point (ETP) Calculator
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Determine the point where time to return equals time to continue, adjusted for wind.
      </p>

      <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
        <li>Used in ETOPS, polar, or overwater operations</li>
        <li>Useful when alternate is far or unavailable</li>
      </ul>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Total Distance (NM)</label>
          <input
            type="number"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium">True Airspeed (KT)</label>
          <input
            type="number"
            value={tas}
            onChange={(e) => setTas(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">
            Wind Component (KT) <span className="text-xs">(positive = tailwind, negative = headwind)</span>
          </label>
          <input
            type="number"
            value={windComponent}
            onChange={(e) => setWindComponent(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
        <div><strong>Continue GS:</strong> {continueGS} KT</div>
        <div><strong>Return GS:</strong> {returnGS} KT</div>
        <div><strong>ETP Distance:</strong> {etpNM()} NM</div>
        <div><strong>Time to ETP:</strong> {etpTime()}</div>
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
            <p><strong>ETP Distance</strong> = (Total Distance × Return GS) / (Continue GS + Return GS)</p>
            <p className="text-xs">Used to determine the halfway-in-time point for diversion logic.</p>
          </div>
          <div>
            <p><strong>ETP Time</strong> = ETP ÷ Continue GS</p>
            <p className="text-xs">Shows time to ETP from departure at current cruise speed.</p>
          </div>
        </div>
      )}
    </div>
  );
}
