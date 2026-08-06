"use client";

import { useState } from "react";

export type BreakdownRow = {
  label: string;
  strauch: number;
  gruen: number;
};

const SERIES_1 = "#2a78d6"; // Strauchschnitt (kategorial Slot 1, validierte Palette)
const SERIES_2 = "#eb6834"; // Gruenschnitt (kategorial Slot 2)
const BAR_HEIGHT = 18;

export default function BreakdownBarChart({ rows }: { rows: BreakdownRow[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-neutral-400 dark:text-neutral-500">
        Noch keine Anlieferungen im Zeitraum.
      </p>
    );
  }

  const maxTotal = Math.max(...rows.map((r) => r.strauch + r.gruen));

  return (
    <div className="viz-root flex flex-col gap-4">
      <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
        <LegendEntry color={SERIES_1} label="Strauchschnitt (m³)" />
        <LegendEntry color={SERIES_2} label="Grünschnitt (m³)" />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const total = row.strauch + row.gruen;
          const strauchPct = (row.strauch / maxTotal) * 100;
          const gruenPct = (row.gruen / maxTotal) * 100;
          const hasBoth = row.strauch > 0 && row.gruen > 0;

          return (
            <div
              key={row.label}
              className="relative flex items-center gap-3"
              onMouseEnter={() => setHovered(row.label)}
              onMouseLeave={() => setHovered((h) => (h === row.label ? null : h))}
            >
              <span className="w-40 shrink-0 truncate text-right text-xs text-neutral-600 dark:text-neutral-400">
                {row.label}
              </span>
              <div className="relative flex-1">
                <div
                  className="flex"
                  style={{ height: BAR_HEIGHT }}
                >
                  {row.strauch > 0 && (
                    <div
                      style={{
                        width: `${strauchPct}%`,
                        backgroundColor: SERIES_1,
                        borderRadius: gruenPct > 0 ? "4px 0 0 4px" : "4px",
                      }}
                    />
                  )}
                  {hasBoth && <div style={{ width: 2 }} />}
                  {row.gruen > 0 && (
                    <div
                      style={{
                        width: `${gruenPct}%`,
                        backgroundColor: SERIES_2,
                        borderRadius: "0 4px 4px 0",
                      }}
                    />
                  )}
                </div>
                {hovered === row.label && (
                  <div className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                    <p style={{ color: SERIES_1 }}>Strauch: {row.strauch.toFixed(2)} m³</p>
                    <p style={{ color: SERIES_2 }}>Grün: {row.gruen.toFixed(2)} m³</p>
                  </div>
                )}
              </div>
              <span className="w-16 shrink-0 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {total.toFixed(2)} m³
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LegendEntry({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
