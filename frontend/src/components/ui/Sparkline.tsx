import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  /** auto = color by trend (last vs first); or force a css var name */
  color?: "auto" | string;
  fill?: boolean;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "auto",
  fill = true,
  strokeWidth = 1.5,
}: SparklineProps) {
  const gradId = useId();
  if (!data || data.length < 2) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = strokeWidth + 1;
  const stepX = (width - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    `M${points[0][0].toFixed(2)} ${height - pad} ` +
    points.map(([x, y]) => `L${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") +
    ` L${points[points.length - 1][0].toFixed(2)} ${height - pad} Z`;

  const stroke =
    color === "auto"
      ? data[data.length - 1] >= data[0]
        ? "var(--pos)"
        : "var(--neg)"
      : `var(${color})`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
        </>
      )}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
