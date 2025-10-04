interface LineChartDataPoint {
  label: string;
  value: number;
}

interface LineChartSeries {
  name: string;
  data: LineChartDataPoint[];
  color: string;
}

interface LineChartProps {
  title: string;
  series: LineChartSeries[];
  className?: string;
  height?: number;
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function LineChart({
  title,
  series,
  className = "",
  height = 300,
  formatValue = (value) => value.toLocaleString(),
  showLegend = true,
  showGrid = true,
}: LineChartProps) {
  if (
    !series ||
    series.length === 0 ||
    series.every((s) => s.data.length === 0)
  ) {
    return (
      <div
        className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
      >
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  // Find min and max values across all series
  const allValues = series.flatMap((s) => s.data.map((d) => d.value));
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const valueRange = maxValue - minValue;
  const padding = valueRange * 0.1;
  const chartMin = Math.max(0, minValue - padding);
  const chartMax = maxValue + padding;
  const chartRange = chartMax - chartMin;

  // Get all unique labels (assume all series have same labels)
  const labels = series[0]?.data.map((d) => d.label) || [];

  // Calculate points for each series
  const chartHeight = height - 80; // Reserve space for labels and legend
  const chartWidth = 100; // percentage

  const getYPosition = (value: number) => {
    if (chartRange === 0) return chartHeight / 2;
    return chartHeight - ((value - chartMin) / chartRange) * chartHeight;
  };

  const getXPosition = (index: number) => {
    if (labels.length <= 1) return 50;
    return (index / (labels.length - 1)) * chartWidth;
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
    >
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 mb-4">
          {series.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm text-gray-300">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {showGrid &&
            [0.25, 0.5, 0.75].map((ratio) => {
              const y = chartHeight * (1 - ratio);
              return (
                <line
                  key={ratio}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#374151"
                  strokeWidth="0.2"
                  opacity="0.5"
                />
              );
            })}

          {/* Draw lines for each series */}
          {series.map((s, seriesIdx) => {
            const points = s.data
              .map((d, i) => {
                const x = getXPosition(i);
                const y = getYPosition(d.value);
                return `${x},${y}`;
              })
              .join(" ");

            return (
              <g key={seriesIdx}>
                {/* Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="0.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {s.data.map((d, i) => {
                  const x = getXPosition(i);
                  const y = getYPosition(d.value);
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r="0.8"
                        fill={s.color}
                        className="hover:r-1.2 transition-all"
                      />
                      {/* Tooltip on hover - simplified */}
                      <title>{`${s.name}: ${formatValue(d.value)}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {labels.map((label, i) => (
            <div
              key={i}
              className="text-xs text-gray-400 text-center"
              style={{
                maxWidth: `${100 / labels.length}%`,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between -translate-x-full pr-2">
          {[
            chartMax,
            chartMax * 0.75 + chartMin * 0.25,
            chartMax * 0.5 + chartMin * 0.5,
            chartMax * 0.25 + chartMin * 0.75,
          ].map((value, i) => (
            <div key={i} className="text-xs text-gray-400 text-right">
              {formatValue(value)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
