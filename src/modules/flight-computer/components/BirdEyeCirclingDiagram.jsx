import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimationFrame } from "framer-motion";

export default function BirdEyeCirclingDiagram({
  groundSpeed,
  altitudeLoss,
  distanceNM,
  heading,
  airportElev,
  downwindDistance,
  downwindSide = "left"
}) {
  const LEFT = {
    descendX: 780,
    descendY: 140,
    turn45X: 640,
    turn45Y: 180,
    downwindX: 520,
    downwindY: 160,
    abeamX: 400,
    abeamY: 160,
    baseX: 340,
    baseY: 180,
    finalX: 360,
    finalY: 220,
    runwayX: 400,
    runwayY: 240,
  };

  const RIGHT = {
    descendX: 780,
    descendY: 260,
    turn45X: 640,
    turn45Y: 220,
    downwindX: 520,
    downwindY: 240,
    abeamX: 400,
    abeamY: 240,
    baseX: 340,
    baseY: 220,
    finalX: 360,
    finalY: 200,
    runwayX: 400,
    runwayY: 180,
  };

  const pos = downwindSide === "right" ? RIGHT : LEFT;
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [angle, setAngle] = useState(0);
  const speed = groundSpeed || 140;
  const duration = 2000 / speed;

  useEffect(() => {
    const path = pathRef.current;
    if (path) {
      const length = path.getTotalLength();
      setPathLength(length);
    }
  }, [groundSpeed]);

  useAnimationFrame((t) => {
    if (pathRef.current && pathLength > 0) {
      const progress = (t / (duration * 1000)) % 1;
      const currentLength = progress * pathLength;
      const point = pathRef.current.getPointAtLength(currentLength);
      const prev = pathRef.current.getPointAtLength(currentLength - 1);
      const dx = point.x - prev.x;
      const dy = point.y - prev.y;
      const theta = Math.atan2(dy, dx) * (180 / Math.PI);
      setPosition({ x: point.x, y: point.y });
      setAngle(theta);
    }
  });

  const points = [
    [pos.descendX, pos.descendY],
    [pos.turn45X, pos.turn45Y],
    [pos.downwindX, pos.downwindY],
    [pos.abeamX, pos.abeamY],
    [pos.baseX, pos.baseY],
    [pos.finalX, pos.finalY],
    [pos.runwayX, pos.runwayY],
  ];

  const polylinePoints = points.map(p => p.join(",")).join(" ");

  return (
    <div className="w-full p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-xl shadow-lg">
      <h2 className="text-lg font-bold text-white mb-4">🦅 Bird-Eye Circling View</h2>
      <svg
        viewBox="200 100 700 300"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="birdGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#29b6f6" />
            <stop offset="100%" stopColor="#66bb6a" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00eaff" />
          </filter>
        </defs>

        {!isNaN(Number(downwindDistance)) && (() => {
          const radiusNM = Number(downwindDistance);
          const scaleFactor = 26;
          const radiusPx = radiusNM * scaleFactor;
          return (
            <>
              <circle
                cx={pos.runwayX}
                cy={pos.runwayY}
                r={radiusPx}
                fill="none"
                stroke="#ffa726"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <text
                x={pos.runwayX + radiusPx + 10}
                y={pos.runwayY - 8}
                fontSize="12"
                fill="#ffa726"
              >
                {radiusNM.toFixed(1)} NM
              </text>
            </>
          );
        })()}

        <polyline
          ref={pathRef}
          points={polylinePoints}
          fill="none"
          stroke="url(#birdGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        <motion.g
          transform={`translate(${position.x - 12}, ${position.y - 12}) rotate(${angle + 40} 12 12) scale(0.05)`}
        >
          <path
            d="M163.1,261l-59.5-25.8l-19,19l47.9,47.9c2.6-7.5,6.7-14.4,12-20.3L163.1,261z M230.2,367.6c-5.9,5.3-12.8,9.4-20.3,12l47.9,47.9l19-19L251,349L230.2,367.6z M291.8,117.1c5.1-5.7,10.5-11.2,15.9-16.3l-46.4-26.1L232,58.2l-52.7-29.6l-30.8,30.8l102.9,102.9L291.8,117.1z M437.3,250.6l-26.1-46.3c-1.8,1.9-3.7,3.9-5.7,5.9c-3.3,3.3-6.9,6.7-10.6,10l-45.1,40.3l102.9,103l30.7-30.8L453.8,280L437.3,250.6z M395.6,200.3c2.9-2.9,5.7-5.8,8.4-8.8c28.6-31.5,48.7-70.1,58.2-111.9c2-8.9-0.9-17.3-6.7-23s-14.1-8.7-23-6.7c-41.8,9.5-80.3,29.6-111.9,58.2c-6.4,5.8-12.5,11.9-18.3,18.4l-40.9,45.7l-84.8,94.8l-21.7,24.3c-5.8,6.5-9.5,14.3-11.1,22.3c-2.8,14.7,1.5,30.5,12.8,41.8c11.3,11.3,27.1,15.7,41.8,12.9c8.1-1.5,15.8-5.2,22.3-11.1l24.3-21.7l94.8-84.8l45.7-40.8C389,206.7,392.3,203.5,395.6,200.3z"
            fill="white"
            stroke="#2196f3"
            strokeWidth="3"
          />
        </motion.g>

        {[{ x: pos.descendX, y: pos.descendY, label: 'Approach' },
          { x: pos.turn45X, y: pos.turn45Y, label: '45° Turn' },
          { x: pos.downwindX, y: pos.downwindY, label: 'Downwind' },
          { x: pos.abeamX, y: pos.abeamY, label: 'Abeam' },
          { x: pos.baseX, y: pos.baseY, label: 'Base' },
          { x: pos.finalX, y: pos.finalY, label: 'Final' }].map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="4" fill="#29b6f6" />
            <text
              x={pt.x}
              y={pt.y - 10}
              fontSize="11"
              fill="#ffffff"
              textAnchor="middle"
            >
              {pt.label}
            </text>
          </g>
        ))}

        <rect
          x={pos.runwayX - 20}
          y={pos.runwayY - 5}
          width="40"
          height="10"
          fill="#e0e0e0"
        />
        <text
          x={pos.runwayX}
          y={pos.runwayY - 12}
          fontSize="12"
          fill="#ffffff"
          textAnchor="middle"
        >
          RWY {heading}°
        </text>

        <text x="220" y="380" fontSize="12" fill="#bbbbbb">
          GS: {groundSpeed?.toFixed(0)} KT | ALT Loss: {altitudeLoss?.toFixed(0)} ft | Desc: {distanceNM?.toFixed(2)} NM | Elev: {airportElev} ft
        </text>
      </svg>
    </div>
  );
}
