import Link from "next/link";
import { listDeliveries } from "@/lib/data/deliveries";
import { getDistrictsWithMunicipalities } from "@/lib/data/districts";
import AnlieferungenTable from "./AnlieferungenTable";

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
    query: params.query,
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
          Suche
          <input
            type="text"
            name="query"
            placeholder="Name, Straße, Gemeinde, Bezirk…"
            defaultValue={params.query}
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

      <AnlieferungenTable deliveries={deliveries ?? []} />
    </div>
  );
}
