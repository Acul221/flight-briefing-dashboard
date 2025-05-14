import { useState } from "react";

export default function PSRCalculator() {
  const [endurance, setEndurance] = useState('');
  const [reserve, setReserve] = useState('');
  const [tas, setTas] = useState('');
  const [windComponent, setWindComponent] = useState('');
  const [showFormula, setShowFormula] = useState(false);

  const parse = (v) => parseFloat(v) || 0;

  const continueGS = parse(tas) + parse(windComponent);
  const returnGS = parse(tas) - parse(windComponent);

  const psrDistance = () => {
    const usableTime = parse(endurance) - parse(reserve);
    const cont = continueGS;
    const ret = returnGS;
    const result = (usableTime * cont * ret) / (cont + ret);
    return isFinite(result) ? result.toFixed(1) : '-';
  };

  const psrTime = () => {
    const d = parse(psrDistance());
    const gs = continueGS;
    if (!isFinite(d) || gs <= 0) return '-';
    const timeDecimal = d / gs;
    const hh = Math.floor(timeDecimal);
    const mm = Math.round((timeDecimal - hh) * 60);
    return `${hh}h ${mm}m (${timeDecimal.toFixed(2)} hr)`;
  };

  const handleClear = () => {
    setEndurance('');
    setReserve('');
    setTas('');
    setWindComponent('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        ✅ Point of Safe Return (PSR) Calculator
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Calculates the farthest point you can go and return safely while keeping fuel reserve.
      </p>

      <ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-400">
        <li>Used in ETOPS, remote, and strategic route planning</li>
        <li>Considers fixed reserve fuel not to be used during return</li>
      </ul>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Total Endurance (hr)</label>
          <input
            type="number"
            value={endurance}
            onChange={(e) => setEndurance(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Reserve Time (hr)</label>
          <input
            type="number"
            value={reserve}
            onChange={(e) => setReserve(e.target.value)}
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

        <div>
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
        <div><strong>PSR Distance:</strong> {psrDistance()} NM</div>
        <div><strong>Time to PSR:</strong> {psrTime()}</div>
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
            <p><strong>PSR (NM)</strong> = (Endurance – Reserve) × GS_continue × GS_return / (GS_continue + GS_return)</p>
            <p className="text-xs">Defines how far you can go and return while maintaining fuel reserves.</p>
          </div>
          <div>
            <p><strong>Time to PSR</strong> = PSR ÷ GS_continue</p>
            <p className="text-xs">Used to monitor turn-back point to guarantee minimum fuel at base.</p>
          </div>
        </div>
      )}
    </div>
  );
}
