import Link from "next/link";
import { listDeliveries } from "@/lib/data/deliveries";
import { getDistrictsWithMunicipalities } from "@/lib/data/districts";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AnlieferungenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const districts = await getDistrictsWithMunicipalities();
  const deliveries = await listDeliveries({
    from: params.from,
    to: params.to,
    districtId: params.districtId,
    name: params.name,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-edaphos-black">Anlieferungen</h1>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-sm">
          Von
          <input
            type="date"
            name="from"
            defaultValue={params.from}
            className="rounded-lg border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Bis
          <input
            type="date"
            name="to"
            defaultValue={params.to}
            className="rounded-lg border border-neutral-300 px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Bezirk
          <select
            name="districtId"
            defaultValue={params.districtId ?? ""}
            className="rounded-lg border border-neutral-300 px-2 py-1"
          >
            <option value="">Alle</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            name="name"
            defaultValue={params.name}
            className="rounded-lg border border-neutral-300 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-edaphos-green px-4 py-1.5 text-sm font-semibold text-white hover:bg-edaphos-green-dark"
        >
          Filtern
        </button>
        <Link href="/admin/anlieferungen" className="text-sm text-neutral-500 underline">
          Zurücksetzen
        </Link>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2">Datum</th>
              <th className="px-4 py-2">Bezirk</th>
              <th className="px-4 py-2">Gemeinde</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Strauchschnitt</th>
              <th className="px-4 py-2">Grünschnitt</th>
            </tr>
          </thead>
          <tbody>
            {deliveries?.map((d) => (
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
                  {d.municipalities?.name ?? d.municipality_freetext}
                </td>
                <td className="px-4 py-2">
                  {d.first_name} {d.last_name}
                </td>
                <td className="px-4 py-2">
                  {d.strauchschnitt_m3 ? `${d.strauchschnitt_m3} m³` : "-"}
                </td>
                <td className="px-4 py-2">
                  {d.gruenschnitt_m3 ? `${d.gruenschnitt_m3} m³` : "-"}
                </td>
              </tr>
            ))}
            {deliveries?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
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
