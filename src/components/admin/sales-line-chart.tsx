"use client";
import { useState } from "react";
type Point = { label: string; value: number };
export function SalesLineChart({
  points,
  metric,
}: {
  points: Point[];
  metric: "Revenue" | "Orders";
}) {
  const [active, setActive] = useState<number | null>(null);
  if (!points.length)
    return (
      <p style={{ textAlign: "center", padding: "65px 0", color: "#777" }}>
        No sales activity in this date range.
      </p>
    );
  const max = Math.max(...points.map((p) => p.value), 1);
  const w = 600,
    h = 220;
  const xy = points.map((p, i) => ({
    x: 55 + (i + 0.5) * (525 / points.length),
    y: 185 - (p.value / max) * 155,
    ...p,
  }));

  const format = (value: number) =>
    metric === "Revenue"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(value)
      : String(value);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      style={{ width: "100%", minHeight: 280 }}
      role="img"
      aria-label={`${metric} over time, ${points.length} dates`}
    >
      {Array.from(new Set([0, 0.25, 0.5, 0.75, 1].map(t => Math.round(t * max)))).map(value => value / max).map((t) => (
        <g key={t}>
          <line
            x1="55"
            x2="580"
            y1={185 - t * 155}
            y2={185 - t * 155}
            stroke="#eee"
          />
          <text
            x="48"
            y={189 - t * 155}
            textAnchor="end"
            fill="#888"
            fontSize="9"
          >
            {Math.round(t * max).toLocaleString("en-IN")}
          </text>
        </g>
      ))}
      {xy.map((p, i) => (
        <g key={p.label}>
          <rect
            x={55 + i * (525 / points.length) + 4}
            y={p.y}
            width={Math.max(2, 525 / points.length - 8)}
            height={Math.max(0, 185 - p.y)}
            fill="#ffd333"
            tabIndex={0}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
          >
            <title>
              {p.label}: {format(p.value)}
            </title>
          </rect>
          {(i === 0 ||
            i === xy.length - 1 ||
            i % Math.max(1, Math.ceil(xy.length / 6)) === 0) && (
            <text
              x={55 + (i + 0.5) * (525 / points.length)}
              y="208"
              textAnchor="middle"
              fontSize="9"
              fill="#888"
            >
              {new Date(p.label + "T00:00:00Z").toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                timeZone: "UTC",
              })}
            </text>
          )}
        </g>
      ))}
      {active !== null && xy[active] && (
        <g>
          <rect
            x={Math.min(480, Math.max(55, xy[active].x - 50))}
            y={Math.max(0, xy[active].y - 40)}
            width="100"
            height="26"
            rx="5"
            fill="#3d474e"
          />
          <text
            x={Math.min(480, Math.max(55, xy[active].x - 50)) + 50}
            y={Math.max(0, xy[active].y - 40) + 17}
            textAnchor="middle"
            fill="white"
            fontSize="10"
          >
            {format(xy[active].value)}
          </text>
        </g>
      )}
    </svg>
  );
}
