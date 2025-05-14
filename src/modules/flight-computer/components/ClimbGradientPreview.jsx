import React, { useState } from "react";

export default function ClimbGradientPreview({ distance, height }) {
  const dist = parseFloat(distance) || 0;
  const alt = parseFloat(height) || 0;

  const [hoveredLine, setHoveredLine] = useState(null);

  if (dist <= 0 || alt <= 0) return null;

  const width = 300;
  const heightSvg = 150;
  const scaleX = width / dist;
  const yMax = Math.max(alt, dist * 0.1 * 60); // up to 10% gradient if needed
  const scaleY = heightSvg / yMax;

  const x1 = 0;
  const y1 = heightSvg;
  const x2 = dist * scaleX;
  const y2 = heightSvg - alt * scaleY;

  const getRefLineY = (percent) =>
    heightSvg - (percent * dist * 60 * scaleY) / 100;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Gradient Visualization
      </h3>
      <div className="relative">
        <svg
          width={width}
          height={heightSvg}
          className="border rounded bg-white dark:bg-gray-700"
        >
          {/* Reference Lines */}
          {[3.3, 5, 10].map((p) => (
            <g key={p}>
              <line
                x1={0}
                y1={heightSvg}
                x2={x2}
                y2={getRefLineY(p)}
                stroke={hoveredLine === p ? "orange" : "gray"}
                strokeDasharray="4"
                strokeWidth={hoveredLine === p ? 2 : 1}
                onMouseEnter={() => setHoveredLine(p)}
                onMouseLeave={() => setHoveredLine(null)}
              />
              <text
                x={x2 - 40}
                y={getRefLineY(p) - 4}
                fontSize="9"
                fill="gray"
              >
                {p}%
              </text>
            </g>
          ))}

          {/* User Gradient Line */}
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="cyan"
            strokeWidth="2"
          >
            <animate
              attributeName="y2"
              from={heightSvg}
              to={y2}
              dur="0.6s"
              fill="freeze"
            />
          </line>

          <circle cx={x2} cy={y2} r="4" fill="cyan">
            <title>Obstacle: {alt} ft @ {dist} NM</title>
          </circle>

          {/* Axis Labels */}
          <text x={0} y={heightSvg - 5} fontSize="9" fill="gray">
            0 NM
          </text>
          <text x={width - 35} y={heightSvg - 5} fontSize="9" fill="gray">
            {dist} NM
          </text>
        </svg>

        {/* Floating Tooltip */}
        {hoveredLine && (
          <div className="absolute top-1 left-1 bg-black text-white text-xs rounded px-2 py-1 opacity-90 animate-fade-in">
            Reference: {hoveredLine}% gradient
          </div>
        )}
      </div>
    </div>
  );
}
