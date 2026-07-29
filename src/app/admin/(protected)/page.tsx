import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data, error } = await supabase
    .from("deliveries")
    .select("strauchschnitt_m3, gruenschnitt_m3")
    .is("deleted_at", null)
    .gte("created_at", monthStart);

  const count = data?.length ?? 0;
  const strauch = (data ?? []).reduce(
    (sum, d) => sum + (Number(d.strauchschnitt_m3) || 0),
    0,
  );
  const gruen = (data ?? []).reduce(
    (sum, d) => sum + (Number(d.gruenschnitt_m3) || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-edaphos-black">Übersicht</h1>
      {error && (
        <p className="text-sm text-red-600">Statistik konnte nicht geladen werden.</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Anlieferungen diesen Monat" value={count.toString()} />
        <StatCard label="Strauchschnitt (m³)" value={strauch.toFixed(2)} />
        <StatCard label="Grünschnitt (m³)" value={gruen.toFixed(2)} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-edaphos-green">{value}</p>
    </div>
  );
}
