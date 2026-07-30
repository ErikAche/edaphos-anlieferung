"use client";

import { useState } from "react";

export type DailyPoint = {
  date: string;
  label: string;
  strauch: number;
  gruen: number;
};

const SERIES_1 = "#2a78d6"; // Strauchschnitt (kategorial Slot 1, validierte Palette)
const SERIES_2 = "#eb6834"; // Gruenschnitt (kategorial Slot 2)

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

export default function DeliveryChart({
  data,
  compact = false,
}: {
  data: DailyPoint[];
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const chartHeight = compact ? 110 : 160;
  const barWidth = compact ? 9 : 20;

  const rawMax = Math.max(...data.map((d) => d.strauch + d.gruen), 0);
  const maxValue = niceMax(rawMax);
  const scale = chartHeight / maxValue;
  const ticks = [0, maxValue / 2, maxValue];

  if (rawMax === 0) {
    return (
      <p className="text-sm text-neutral-400">
        Noch keine Anlieferungen im Zeitraum.
      </p>
    );
  }

  return (
    <div className="viz-root flex flex-col gap-3">
      <div
        className={
          compact
            ? "flex flex-col gap-1 text-xs text-neutral-600"
            : "flex items-center gap-4 text-sm text-neutral-600"
        }
      >
        <LegendEntry color={SERIES_1} label="Strauchschnitt (m³)" />
        <LegendEntry color={SERIES_2} label="Grünschnitt (m³)" />
      </div>

      <div className="flex gap-2">
        {!compact && (
          <div
            className="flex flex-col justify-between text-right text-xs text-neutral-400"
            style={{ height: chartHeight }}
          >
            {[...ticks].reverse().map((t) => (
              <span key={t}>{t.toFixed(t < 10 ? 1 : 0)}</span>
            ))}
          </div>
        )}

        <div className="relative flex-1">
          <div
            className="absolute inset-0 flex flex-col justify-between"
            aria-hidden
          >
            {ticks.map((t) => (
              <div key={t} className="border-t border-neutral-200" />
            ))}
          </div>

          <div
            className={`relative flex items-end ${compact ? "gap-0.5" : "gap-1"}`}
            style={{ height: chartHeight }}
          >
            {data.map((d) => {
              const strauchHeight = Math.round(d.strauch * scale);
              const gruenHeight = Math.round(d.gruen * scale);
              const hasBoth = strauchHeight > 0 && gruenHeight > 0;
              const topIsStrauch = strauchHeight > 0;

              return (
                <div
                  key={d.date}
                  className="relative flex flex-1 flex-col items-center justify-end"
                  style={{ height: chartHeight }}
                  onMouseEnter={() => setHovered(d.date)}
                  onMouseLeave={() => setHovered((h) => (h === d.date ? null : h))}
                >
                  {hovered === d.date && (
                    <div className="absolute bottom-full right-0 z-10 mb-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold text-edaphos-black">{d.label}</p>
                      <p style={{ color: SERIES_1 }}>Strauch: {d.strauch.toFixed(2)} m³</p>
                      <p style={{ color: SERIES_2 }}>Grün: {d.gruen.toFixed(2)} m³</p>
                    </div>
                  )}
                  <div
                    className="flex flex-col"
                    style={{ width: barWidth }}
                  >
                    {topIsStrauch && (
                      <div
                        style={{
                          height: strauchHeight,
                          backgroundColor: SERIES_1,
                          borderRadius: "4px 4px 0 0",
                        }}
                      />
                    )}
                    {hasBoth && <div style={{ height: 2 }} />}
                    {gruenHeight > 0 && (
                      <div
                        style={{
                          height: gruenHeight,
                          backgroundColor: SERIES_2,
                          borderRadius: topIsStrauch ? 0 : "4px 4px 0 0",
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="flex gap-1 pl-8">
          {data.map((d) => (
            <span
              key={d.date}
              className="flex-1 text-center text-[10px] text-neutral-400"
            >
              {d.label}
            </span>
          ))}
        </div>
      )}
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
