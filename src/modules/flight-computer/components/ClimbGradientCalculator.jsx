import { useState } from "react";
import ClimbGradientPreview from "./ClimbGradientPreview";

export default function ClimbGradientCalculator() {
  const [gs, setGs] = useState('');
  const [obstacleHeight, setObstacleHeight] = useState('');
  const [distance, setDistance] = useState('');
  const [knownMode, setKnownMode] = useState('obstacle'); // 'obstacle', 'roc', 'percent'
  const [knownValue, setKnownValue] = useState('');
  const [showFormula, setShowFormula] = useState(false);

  const parse = (v) => parseFloat(v) || 0;
  const gsVal = parse(gs);

  // ft/NM calculation
  let ftPerNM = 0;
  if (knownMode === 'obstacle') {
    const dist = parse(distance);
    const height = parse(obstacleHeight);
    ftPerNM = dist > 0 ? height / dist : 0;
  } else if (knownMode === 'roc') {
    ftPerNM = gsVal > 0 ? (parse(knownValue) * 60) / gsVal : 0;
  } else if (knownMode === 'percent') {
    ftPerNM = parse(knownValue) * 60;
  }

  const percentGradient = ftPerNM / 60;
  const roc = (ftPerNM * gsVal) / 60;

  const handleClear = () => {
    setGs('');
    setObstacleHeight('');
    setDistance('');
    setKnownValue('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
        📈 Climb Gradient & Required ROC Calculator
      </h2>

      <p className="text-sm text-gray-600 dark:text-gray-300">
        Convert between climb gradient, ROC, and obstacle clearance.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Ground Speed (KT)</label>
          <input
            type="number"
            value={gs}
            onChange={(e) => setGs(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Mode: I know...</label>
          <select
            value={knownMode}
            onChange={(e) => {
              setKnownMode(e.target.value);
              setKnownValue('');
            }}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
          >
            <option value="obstacle">Obstacle Height & Distance</option>
            <option value="roc">Rate of Climb (fpm)</option>
            <option value="percent">Climb Gradient (%)</option>
          </select>
        </div>

        {knownMode === 'obstacle' && (
          <>
            <div>
              <label className="text-sm font-medium">Obstacle Height (FT)</label>
              <input
                type="number"
                value={obstacleHeight}
                onChange={(e) => setObstacleHeight(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Distance to Obstacle (NM)</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        )}

        {knownMode !== 'obstacle' && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">
              {knownMode === 'roc' ? 'Rate of Climb (fpm)' : 'Climb Gradient (%)'}
            </label>
            <input
              type="number"
              value={knownValue}
              onChange={(e) => setKnownValue(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
      </div>

      <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
        <div><strong>Climb Gradient:</strong> {percentGradient.toFixed(2)}%</div>
        <div><strong>Feet per NM:</strong> {ftPerNM.toFixed(1)} ft/NM</div>
        <div><strong>Required ROC:</strong> {roc.toFixed(1)} fpm</div>
      </div>

      {knownMode === 'obstacle' && (
        <ClimbGradientPreview distance={distance} height={obstacleHeight} />
      )}

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
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mt-2">
          <div>
            <p><strong>% Gradient</strong> = (ROC ÷ GS) × 100</p>
            <p className="text-xs">Use this when you know the vertical speed and groundspeed.</p>
          </div>
          <div>
            <p><strong>ft/NM</strong> = % Gradient × 60</p>
            <p className="text-xs">Used in SID or ODP procedures, often minimum 200 ft/NM.</p>
          </div>
          <div>
            <p><strong>ROC</strong> = ft/NM × (GS ÷ 60)</p>
            <p className="text-xs">Converts gradient into required climb rate.</p>
          </div>
          <div>
            <p><strong>ft/NM (Obstacle)</strong> = Obstacle ÷ Distance (NM)</p>
            <p className="text-xs">Used to check terrain clearance requirement.</p>
          </div>
        </div>
      )}
    </div>
  );
}
