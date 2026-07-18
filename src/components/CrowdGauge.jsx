import React, { useEffect, useRef } from 'react';

/**
 * CrowdGauge — SVG circular arc gauge for crowd density.
 * Animates from 0 → value on mount and transitions smoothly on updates.
 */
export default function CrowdGauge({ value = 0, size = 100, label = '' }) {
  const circleRef = useRef(null);

  const radius      = 38;
  const stroke      = 7;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedVal  = Math.max(0, Math.min(100, value));

  // Color gradient based on density
  const color =
    clampedVal >= 85 ? '#ef4444' :
    clampedVal >= 70 ? '#f97316' :
    clampedVal >= 40 ? '#3b82f6' :
                       '#10b981';

  const bgStrokeColor = 'rgba(255,255,255,0.07)';

  // Compute arc (start from top = -90°)
  const dashArray  = `${(clampedVal / 100) * circumference} ${circumference}`;
  const dashOffset = '0';

  // Apply transition via style on the circle element
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s ease';
    }
  }, []);

  const fontSize    = size < 80 ? '14' : '18';
  const subFontSize = size < 80 ? '7'  : '8';

  return (
    <div className="flex flex-col items-center gap-1" aria-label={`Crowd density: ${Math.round(clampedVal)}%`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-hidden="true"
      >
        {/* Glow filter for critical */}
        <defs>
          <filter id={`glow-${Math.round(clampedVal)}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={bgStrokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <circle
          ref={circleRef}
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter={clampedVal >= 85 ? `url(#glow-${Math.round(clampedVal)})` : undefined}
        />

        {/* Center label */}
        <text
          x={cx} y={cy - 4}
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {Math.round(clampedVal)}%
        </text>
        {label && (
          <text
            x={cx} y={cy + parseInt(fontSize) - 2}
            textAnchor="middle"
            fill="rgba(148,163,184,0.8)"
            fontSize={subFontSize}
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
