"use client";

import { useMemo, useState } from "react";
import type { DistrictOption } from "@/lib/data/districts";

function toLocalDateString(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function today() {
  return toLocalDateString(new Date());
}

function firstOfMonth() {
  const d = new Date();
  return toLocalDateString(new Date(d.getFullYear(), d.getMonth(), 1));
}

export default function ExportForm({
  districts,
}: {
  districts: DistrictOption[];
}) {
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(today());
  const [useFilter, setUseFilter] = useState(false);
  const [districtId, setDistrictId] = useState("");
  const [municipalityId, setMunicipalityId] = useState("");

  const municipalities = useMemo(
    () => districts.find((d) => d.id === districtId)?.municipalities ?? [],
    [districts, districtId],
  );

  const href = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", from);
    // "bis" inklusive: Ende des Tages
    params.set("to", to ? `${to}T23:59:59` : "");
    if (useFilter && districtId) params.set("districtId", districtId);
    if (useFilter && municipalityId) params.set("municipalityId", municipalityId);
    return `/api/admin/export?${params.toString()}`;
  }, [from, to, useFilter, districtId, municipalityId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Von
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Bis
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={useFilter}
          onChange={(e) => setUseFilter(e.target.checked)}
        />
        Nur bestimmten Bezirk / bestimmte Gemeinde exportieren (Ausnahmefall)
      </label>

      {useFilter && (
        <div className="flex gap-4 rounded-lg bg-neutral-50 p-3">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Bezirk
            <select
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setMunicipalityId("");
              }}
              className="rounded-lg border border-neutral-300 px-2 py-1.5"
            >
              <option value="">Alle</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Gemeinde
            <select
              value={municipalityId}
              onChange={(e) => setMunicipalityId(e.target.value)}
              disabled={!districtId}
              className="rounded-lg border border-neutral-300 px-2 py-1.5 disabled:bg-neutral-100"
            >
              <option value="">Alle</option>
              {municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <a
        href={href}
        className="self-start rounded-lg bg-edaphos-green px-4 py-2 text-sm font-semibold text-white hover:bg-edaphos-green-dark"
      >
        Excel exportieren
      </a>
    </div>
  );
}
