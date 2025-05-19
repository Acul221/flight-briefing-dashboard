import React, { useEffect, useRef } from "react";

export default function CirclingApproachDiagram({
  groundSpeed,
  altitudeLoss,
  distanceNM,
  heading,
  airportElev,
  downwindDistance,
  downwindSide = "left"
}) {
  const LEFT = {
    descendX: 790,
    descendY: 220,
    turn45X: 600,
    turn45Y: 280,
    downwindX: 500,
    downwindY: 200,
    abeamX: 350,
    abeamY: 200,
    baseX: 300,
    baseY: 200,
    finalX: 300,
    finalY: 250,
    runwayX: 350,
    runwayY: 250,
  };

  const RIGHT = {
    descendX: 790,
    descendY: 180,
    turn45X: 600,
    turn45Y: 240,
    downwindX: 500,
    downwindY: 300,
    abeamX: 350,
    abeamY: 300,
    baseX: 300,
    baseY: 300,
    finalX: 300,
    finalY: 250,
    runwayX: 350,
    runwayY: 250,
  };

  const pos = downwindSide === "right" ? RIGHT : LEFT;
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.getBoundingClientRect();
    path.style.transition = "stroke-dashoffset 2s ease-in-out";
    path.style.strokeDashoffset = "0";
  }, []);

  return (
    <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
      <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
        🛬 Circling Approach Pattern (Dynamic)
      </h2>
      <svg
        viewBox="200 100 700 300"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: "#1c2732" }}
      >
        <defs>
          <linearGradient id="descentGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00eaff" />
            <stop offset="100%" stopColor="#4caf50" />
          </linearGradient>
          <clipPath id="rounded">
            <rect x="200" y="100" width="700" height="300" rx="24" ry="24" />
          </clipPath>
        </defs>

          <g clipPath="url(#rounded)">
          {/* Circling Distance Radius (orange) centered at fixed runway position */}
          {!isNaN(Number(downwindDistance)) && (() => {
            const radiusNM = Number(downwindDistance);
            const scaleFactor = 26;
            const radiusPx = radiusNM * scaleFactor;
            const cx = 350; // fixed runwayX
            const cy = 250; // fixed runwayY for visual alignment
            return (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={radiusPx}
                  fill="none"
                  stroke="#ffa726"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x={cx + radiusPx + 7}
                  y={cy - 10}
                  fontSize="12"
                  fill="#ffa726"
                  textAnchor="start"
                >
                  {radiusNM.toFixed(1)} NM
                </text>
              </>
            );
          })()}

          {/* OCA Radius Circle and Label */}
          {downwindSide === "left" && (
            <>
              <circle
                cx={pos.runwayX + 20}
                cy={pos.downwindY + 50}
                r="115"
                fill="none"
                stroke="#ff0209"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text
                x={pos.runwayX + 140}
                y={pos.downwindY + 110}
                fontSize="10"
                fill="#ff0209"
                textAnchor="start"
              >
                <tspan x={pos.runwayX + 140} dy="0">4.2 NM Obstruction Clearance Area</tspan>
                <tspan x={pos.runwayX + 140} dy="1.2em">from Runway Center Line</tspan>
              </text>
            </>
          )}

          {downwindSide === "right" && (
            <>
              <circle
                cx={pos.runwayX + 20}
                cy={pos.downwindY - 50}
                r="115"
                fill="none"
                stroke="#ff0209"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text
                x={pos.runwayX + 140}
                y={pos.downwindY - 110}
                fontSize="10"
                fill="#ff0209"
                textAnchor="end"
              >
                <tspan x={pos.runwayX + 290} dy="0">4.2 NM Obstruction Clearance Area</tspan>
                <tspan x={pos.runwayX + 245} dy="1.2em">from Runway Center Line</tspan>
              </text>
            </>
          )}

          {/* Approach to Turn 45° */}
          <line
            x1={pos.descendX}
            y1={pos.descendY}
            x2={pos.turn45X}
            y2={pos.turn45Y}
            stroke="#00eaff"
            strokeWidth="3"
            strokeDasharray="6,4"
            strokeLinecap="round"
          />

          {/* Flight Path */}
          <polyline
            ref={pathRef}
            points={`
              ${pos.turn45X},${pos.turn45Y} 
              ${pos.downwindX},${pos.downwindY} 
              ${pos.abeamX},${pos.abeamY} 
              ${pos.baseX},${pos.baseY} 
              ${pos.finalX},${pos.finalY} 
              ${pos.runwayX},${pos.runwayY}`}
            fill="none"
            stroke="url(#descentGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Info Box */}
          <rect x="700" y="300" width="190" height="80" fill="#ffffff" opacity="0.05" rx="10" />
          <text x="715" y="320" fontSize="12" fill="#ffffff">GS: {groundSpeed?.toFixed(0)} KT</text>
          <text x="715" y="345" fontSize="12" fill="#ffffff">Altitude Loss: {altitudeLoss?.toFixed(0)} ft</text>
          <text x="715" y="365" fontSize="12" fill="#ffffff">Distance to Descend: {distanceNM?.toFixed(2)} NM</text>

          {/* Footer */}
          <text x="220" y="380" fontSize="12" fill="#bbbbbb">
            Elevation: {airportElev} ft | RWY Bearing: {heading}°
          </text>

          {/* Labels */}
          {[{x: pos.descendX, y: pos.descendY, label: 'Approach'},
            {x: pos.turn45X, y: pos.turn45Y, label: 'Turn 45°'},
            {x: pos.downwindX, y: pos.downwindY, label: 'Downwind'},
            {x: pos.abeamX, y: pos.abeamY, label: 'Abeam'},
            {x: pos.baseX, y: pos.baseY, label: 'Base'},
            {x: pos.finalX, y: pos.finalY, label: 'Final'}].map((pt, idx) => (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="4" fill="#42a5f5" />
              <text x={pt.x} y={pt.y - 10} fontSize="12" fill="#ffffff" textAnchor="middle">
                <tspan>{pt.label}</tspan>
              </text>
            </g>
          ))}

          {/* Runway */}
          <rect x={pos.runwayX} y={pos.runwayY - 5} width="40" height="10" fill="#cccccc" />
          <text x={pos.runwayX + 20} y={pos.runwayY - 10} fontSize="12" fill="#ffffff" textAnchor="middle">Runway {heading}°</text>
        </g>
      </svg>
    </div>
  );
}
