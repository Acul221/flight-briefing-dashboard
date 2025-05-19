import { useState } from "react";
import CirclingApproachDiagram from "./CirclingApproachDiagram";
import BirdEyeCirclingDiagram from "./BirdEyeCirclingDiagram";

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function windComponent(tas, windDir, windSpeed, track) {
  const windAngle = toRadians(windDir - track);
  return windSpeed * Math.cos(windAngle);
}

export default function VisualDescentPlanner() {
  const [initialAlt, setInitialAlt] = useState(2300);
  const [targetAlt, setTargetAlt] = useState(1300);
  const [airportElev, setAirportElev] = useState(0);
  const [tas, setTas] = useState(150);
  const [windDir, setWindDir] = useState(0);
  const [windSpeed, setWindSpeed] = useState(0);
  const [runwayBearing, setRunwayBearing] = useState(210);
  const [downwindDistance, setDownwindDistance] = useState(3);
  const [desiredVS, setDesiredVS] = useState(500);
  const [downwindSide, setDownwindSide] = useState("left");
  const [viewMode, setViewMode] = useState("2d");

  const [showFormula, setShowFormula] = useState({
    gs: false,
    alt: false,
    time: false,
    distance: false,
    glide: false,
    turn: false,
  });

  const toggleFormula = (key) => {
    setShowFormula((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReset = () => {
    setInitialAlt(2300);
    setTargetAlt(1300);
    setAirportElev(0);
    setTas(150);
    setWindDir(0);
    setWindSpeed(0);
    setRunwayBearing(210);
    setDownwindDistance(3);
    setDesiredVS(500);
    setDownwindSide("left");
    setViewMode("2d");
  };

  const safeInitialAlt = Number(initialAlt) || 1;
  const safeTargetAlt = Number(targetAlt) || 0;
  const safeAirportElev = Number(airportElev) || 0;
  const safeTAS = Number(tas) || 1;
  const safeWindDir = Number(windDir) || 0;
  const safeWindSpeed = Number(windSpeed) || 0;
  const safeRunwayBearing = Number(runwayBearing) || 0;
  const safeDownwindDistance = Number(downwindDistance) || 0;
  const safeDesiredVS = Number(desiredVS) || 1;

  const targetAltMSL = safeTargetAlt + safeAirportElev;
  const altitudeLoss = safeInitialAlt - targetAltMSL;
  const windCorr = windComponent(safeTAS, safeWindDir, safeWindSpeed, safeRunwayBearing);
  const gs = safeTAS + windCorr;
  const descentTime = altitudeLoss / safeDesiredVS;
  const distanceNeeded = gs * descentTime / 60;
  const heading45 = (safeRunwayBearing + 45) % 360;

  const idealGlideAngle = 3;
  const actualGlideAngle = Math.atan(altitudeLoss / (distanceNeeded * 6076)) * (180 / Math.PI);
  const deviation = actualGlideAngle - idealGlideAngle;
  const status = deviation > 0.3 ? "Too steep" : deviation < -0.3 ? "Too shallow" : "OK";

  const baseTurnDelay =
    45 + ((safeInitialAlt - 1500) / 100) * 3 +
    (windCorr < 0 ? Math.abs(windCorr) : -Math.abs(windCorr));

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white">
        ✈️ Visual/Circling Approach Timing Planner
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Altitude at Downwind (MSL)" value={initialAlt} setter={setInitialAlt} />
        <Input label="Target Altitude on Final (AGL)" value={targetAlt} setter={setTargetAlt} />
        <Input label="Airport Elevation (ft)" value={airportElev} setter={setAirportElev} />
        <Input label="Downwind Distance from RWY (NM)" value={downwindDistance} setter={setDownwindDistance} />
        <Input label="Desired Vertical Speed (fpm)" value={desiredVS} setter={setDesiredVS} />
        <Input label="True Airspeed (KTAS)" value={tas} setter={setTas} />
        <Input label="Wind Direction (°)" value={windDir} setter={setWindDir} />
        <Input label="Wind Speed (KT)" value={windSpeed} setter={setWindSpeed} />
        <Input label="Runway Bearing (°)" value={runwayBearing} setter={setRunwayBearing} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm mt-2">
        <label className="flex items-center gap-1">
          <input type="radio" value="left" checked={downwindSide === "left"} onChange={() => setDownwindSide("left")} />
          Left Downwind
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="right" checked={downwindSide === "right"} onChange={() => setDownwindSide("right")} />
          Right Downwind
        </label>

        <label className="flex items-center gap-1 ml-4">
          <input type="radio" value="2d" checked={viewMode === "2d"} onChange={() => setViewMode("2d")} />
          2D View
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" value="bird" checked={viewMode === "bird"} onChange={() => setViewMode("bird")} />
          Bird-Eye View
        </label>
      </div>

      <div className="flex justify-end mt-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition"
        >
          Reset All
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-800 dark:text-gray-200 space-y-4">
        <Formula label="Target Altitude (MSL)" value={`${targetAltMSL.toFixed(0)} ft`} formula="Target MSL = Target AGL + Airport Elev" toggle={showFormula.alt} onToggle={() => toggleFormula("alt")} />
        <Formula label="Altitude to Lose" value={`${altitudeLoss.toFixed(0)} ft`} formula="Altitude Loss = Initial Alt - Target MSL" toggle={showFormula.alt} onToggle={() => toggleFormula("alt")} />
        <Formula label="Corrected Ground Speed" value={`${gs.toFixed(1)} KT`} formula="GS = TAS ± Wind × cos(WindDir − Track)" toggle={showFormula.gs} onToggle={() => toggleFormula("gs")} />
        <Formula label="Descent Time" value={`${descentTime.toFixed(1)} minutes`} formula="Time = Altitude Loss ÷ VS" toggle={showFormula.time} onToggle={() => toggleFormula("time")} />
        <Formula label="Distance to Descend" value={`${distanceNeeded.toFixed(2)} NM`} formula="Distance = GS × Time ÷ 60" toggle={showFormula.distance} onToggle={() => toggleFormula("distance")} />
        <Formula label="Glide Angle" value={`${actualGlideAngle.toFixed(1)}°`} formula="Glide = arctan(Altitude Loss ÷ Distance × 6076)" toggle={showFormula.glide} onToggle={() => toggleFormula("glide")} />
        <p><strong>Glide Path Status:</strong> {status}</p>
        <Formula label="Suggested Base Turn Delay (FCTM)" value={`${baseTurnDelay.toFixed(0)} sec after abeam`} formula="Delay = 45s + 3s/100ft + Wind Corr" toggle={showFormula.turn} onToggle={() => toggleFormula("turn")} />
        <p className="text-xs text-gray-500 italic">VS Profile: Start ~400 fpm, increase to ~700 fpm when established on glide.</p>
        <p><strong>Recommended Turn at:</strong> Heading {heading45.toFixed(0)}°</p>
      </div>

      {/* Diagram */}
      {viewMode === "2d" ? (
        <CirclingApproachDiagram 
          groundSpeed={gs}
          altitudeLoss={altitudeLoss}
          distanceNM={distanceNeeded}
          heading={safeRunwayBearing}
          airportElev={safeAirportElev}
          downwindDistance={safeDownwindDistance}
          downwindSide={downwindSide}
        />
      ) : (
        <BirdEyeCirclingDiagram
          groundSpeed={gs}
          altitudeLoss={altitudeLoss}
          distanceNM={distanceNeeded}
          heading={safeRunwayBearing}
          airportElev={safeAirportElev}
          downwindDistance={safeDownwindDistance}
          downwindSide={downwindSide}
        />
      )}
    </div>
  );
}

// Reusable input field component
function Input({ label, value, setter }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="w-full rounded px-3 py-2 mt-1 border dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
}

// Reusable formula toggle component
function Formula({ label, value, formula, toggle, onToggle }) {
  return (
    <div>
      <p className="flex items-center gap-2">
        <strong>{label}:</strong> {value}
        <button onClick={onToggle} className="text-xs text-blue-400 underline">
          {toggle ? "Hide" : "Show Formula"}
        </button>
      </p>
      {toggle && <p className="text-xs text-gray-400">{formula}</p>}
    </div>
  );
}
