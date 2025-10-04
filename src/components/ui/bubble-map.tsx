"use client";
import { useMemo } from "react";

interface BubbleMapDataPoint {
  region: string;
  country: string;
  value: number;
  secondaryValue?: number;
}

interface BubbleMapProps {
  title: string;
  data: BubbleMapDataPoint[];
  className?: string;
  height?: number;
  formatValue?: (value: number) => string;
  metric?: string;
  colorScheme?: "blue" | "green" | "red" | "purple" | "orange";
}

// Accurate UAE city coordinates
const UAE_COORDINATES: { [key: string]: { x: number; y: number } } = {
  Dubai: { x: 62, y: 58 },
  "Abu Dhabi": { x: 45, y: 65 },
  Sharjah: { x: 65, y: 56 },
  Ajman: { x: 67, y: 54 },
  "Ras Al Khaimah": { x: 70, y: 42 },
  Fujairah: { x: 75, y: 52 },
  "Umm Al Quwain": { x: 68, y: 50 },
  "Al Ain": { x: 52, y: 68 },
};

export function BubbleMap({
  title,
  data,
  className = "",
  height = 500,
  formatValue = (value) => `$${value.toLocaleString()}`,
  metric = "Value",
  colorScheme = "green",
}: BubbleMapProps) {
  // Color schemes with gradients
  const colors = {
    blue: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#1E40AF",
      glow: "rgba(59, 130, 246, 0.4)",
    },
    green: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
      glow: "rgba(16, 185, 129, 0.4)",
    },
    red: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#B91C1C",
      glow: "rgba(239, 68, 68, 0.4)",
    },
    purple: {
      main: "#8B5CF6",
      light: "#A78BFA",
      dark: "#6D28D9",
      glow: "rgba(139, 92, 246, 0.4)",
    },
    orange: {
      main: "#F97316",
      light: "#FB923C",
      dark: "#C2410C",
      glow: "rgba(249, 115, 22, 0.4)",
    },
  };

  const currentColors = colors[colorScheme];

  // Calculate bubble sizes
  const enrichedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    return data
      .map((d) => {
        const coords = UAE_COORDINATES[d.region] || UAE_COORDINATES["Dubai"];
        // Use square root scaling for better visual distribution
        const normalizedValue =
          maxValue === minValue
            ? 0.5
            : Math.sqrt((d.value - minValue) / (maxValue - minValue));
        const size = 8 + normalizedValue * 24; // Size between 8 and 32

        return {
          ...d,
          x: coords.x,
          y: coords.y,
          size,
          opacity: 0.7 + normalizedValue * 0.3,
        };
      })
      .sort((a, b) => b.size - a.size); // Draw larger bubbles first
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div
        className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
      >
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-96 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="text-xs text-gray-400">
          Bubble size represents {metric.toLowerCase()}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentColors.main }}
            />
            <span className="text-gray-400">Higher</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentColors.light, opacity: 0.6 }}
            />
            <span className="text-gray-400">Lower</span>
          </div>
        </div>
      </div>

      <div
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Radial gradient for bubbles */}
            <radialGradient id={`bubbleGradient-${colorScheme}`}>
              <stop
                offset="0%"
                stopColor={currentColors.light}
                stopOpacity="0.9"
              />
              <stop
                offset="70%"
                stopColor={currentColors.main}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={currentColors.dark}
                stopOpacity="0.7"
              />
            </radialGradient>

            {/* Glow filter */}
            <filter id={`glow-${colorScheme}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Detailed UAE map outline */}
          <path
            d="M 72,38 L 75,45 L 76,50 L 75,55 L 70,58 L 68,60 L 65,62 L 60,64 L 55,66 L 50,68 L 45,69 L 40,68 L 35,66 L 32,63 L 30,59 L 28,54 L 28,48 L 30,43 L 33,39 L 37,36 L 42,34 L 48,33 L 54,33 L 60,34 L 65,36 L 69,38 Z"
            fill="#1F2937"
            stroke="#374151"
            strokeWidth="0.3"
            opacity="0.8"
          />

          {/* Draw bubbles */}
          {enrichedData.map((point, index) => (
            <g key={index} className="transition-all duration-300">
              {/* Outer glow circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={point.size * 1.4}
                fill={currentColors.glow}
                opacity="0.3"
                className="animate-pulse"
                style={{
                  animationDuration: "3s",
                  animationDelay: `${index * 0.1}s`,
                }}
              />

              {/* Main bubble with gradient */}
              <circle
                cx={point.x}
                cy={point.y}
                r={point.size}
                fill={`url(#bubbleGradient-${colorScheme})`}
                opacity={point.opacity}
                stroke={currentColors.dark}
                strokeWidth="0.4"
                filter={`url(#glow-${colorScheme})`}
                className="hover:opacity-100 transition-all duration-300 cursor-pointer"
              >
                <title>
                  {point.region}, {point.country}
                  {"\n"}
                  {metric}: {formatValue(point.value)}
                  {point.secondaryValue !== undefined &&
                    `\nSecondary: ${formatValue(point.secondaryValue)}`}
                </title>
              </circle>

              {/* Region label with background */}
              <g>
                <text
                  x={point.x}
                  y={point.y + point.size + 4}
                  fontSize="2.5"
                  fontWeight="600"
                  fill="#E5E7EB"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                  style={{
                    paintOrder: "stroke",
                    stroke: "#111827",
                    strokeWidth: "0.5px",
                  }}
                >
                  {point.region}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>

      {/* Data table below map */}
      <div className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">
                  Region
                </th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">
                  {metric}
                </th>
                {enrichedData.some((d) => d.secondaryValue !== undefined) && (
                  <th className="text-right py-3 px-3 text-gray-400 font-medium text-xs uppercase tracking-wider">
                    Secondary
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {enrichedData
                .sort((a, b) => b.value - a.value)
                .map((point, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: currentColors.main }}
                        />
                        <span className="text-white font-medium">
                          {point.region}
                        </span>
                      </div>
                    </td>
                    <td
                      className="py-3 px-3 text-right font-semibold"
                      style={{ color: currentColors.light }}
                    >
                      {formatValue(point.value)}
                    </td>
                    {point.secondaryValue !== undefined && (
                      <td className="py-3 px-3 text-right text-gray-300">
                        {formatValue(point.secondaryValue)}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
