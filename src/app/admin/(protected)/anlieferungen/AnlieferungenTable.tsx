"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { deleteDelivery } from "@/lib/actions/admin-deliveries";
import { resolveMunicipalityDisplayName } from "@/lib/format";
import { isSuspiciousDelivery } from "@/lib/flags";
import { findDuplicateDeliveryIds } from "@/lib/duplicates";

type DeliveryRow = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
  strauchschnitt_m3: number | null;
  gruenschnitt_m3: number | null;
  municipality_freetext: string | null;
  districts: { name: string } | null;
  municipalities: { name: string; is_catch_all: boolean } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AnlieferungenTable({
  deliveries,
}: {
  deliveries: DeliveryRow[];
}) {
  const router = useRouter();
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const duplicateIds = useMemo(
    () => findDuplicateDeliveryIds(deliveries),
    [deliveries],
  );

  const visibleDeliveries = useMemo(() => {
    if (!onlyFlagged) return deliveries;
    return deliveries.filter(
      (d) =>
        isSuspiciousDelivery(d.strauchschnitt_m3, d.gruenschnitt_m3) ||
        duplicateIds.has(d.id),
    );
  }, [deliveries, onlyFlagged, duplicateIds]);

  async function handleDelete(id: string) {
    if (!confirm("Diese Anlieferung wirklich löschen?")) return;
    setDeletingId(id);
    const result = await deleteDelivery(id);
    setDeletingId(null);
    if (!result.success) {
      alert(result.error ?? "Löschen fehlgeschlagen.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
        <input
          type="checkbox"
          checked={onlyFlagged}
          onChange={(e) => setOnlyFlagged(e.target.checked)}
        />
        Nur auffällige anzeigen (hohe Menge oder mögliches Duplikat)
      </label>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2">Datum</th>
              <th className="px-4 py-2">Bezirk</th>
              <th className="px-4 py-2">Gemeinde</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Strauchschnitt</th>
              <th className="px-4 py-2">Grünschnitt</th>
              <th className="px-4 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {visibleDeliveries.map((d) => {
              const flagged = isSuspiciousDelivery(
                d.strauchschnitt_m3,
                d.gruenschnitt_m3,
              );
              const isDuplicate = duplicateIds.has(d.id);
              return (
                <tr
                  key={d.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/anlieferungen/${d.id}`}
                      className="text-edaphos-green hover:underline"
                    >
                      {formatDate(d.created_at)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{d.districts?.name}</td>
                  <td className="px-4 py-2">
                    {resolveMunicipalityDisplayName(
                      d.municipalities,
                      d.municipality_freetext,
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1">
                      {d.first_name} {d.last_name}
                      {isDuplicate && <DuplicateBadge />}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1">
                      {d.strauchschnitt_m3 ? `${d.strauchschnitt_m3} m³` : "-"}
                      {flagged && Boolean(d.strauchschnitt_m3) && <FlagBadge />}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1">
                      {d.gruenschnitt_m3 ? `${d.gruenschnitt_m3} m³` : "-"}
                      {flagged && Boolean(d.gruenschnitt_m3) && <FlagBadge />}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      <Link
                        href={`/admin/anlieferungen/${d.id}`}
                        className="text-sm font-medium text-edaphos-green hover:underline"
                      >
                        Bearbeiten
                      </Link>
                      <button
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        {deletingId === d.id ? "Löscht…" : "Löschen"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleDeliveries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                  Keine Anlieferungen gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlagBadge() {
  return (
    <span
      title="Ungewöhnlich hohe Menge – bitte prüfen"
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white"
    >
      !
    </span>
  );
}

function DuplicateBadge() {
  return (
    <span
      title="Mögliches Duplikat – gleicher Name & Adresse am selben Tag"
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white"
    >
      2
    </span>
  );
}
