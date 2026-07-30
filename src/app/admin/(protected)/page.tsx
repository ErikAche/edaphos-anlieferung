import { createClient } from "@/lib/supabase/server";

type Totals = { count: number; strauch: number; gruen: number };

async function getTotalsSince(
  supabase: Awaited<ReturnType<typeof createClient>>,
  since: string,
): Promise<Totals> {
  const { data } = await supabase
    .from("deliveries")
    .select("strauchschnitt_m3, gruenschnitt_m3")
    .is("deleted_at", null)
    .gte("created_at", since);

  const rows = data ?? [];
  return {
    count: rows.length,
    strauch: rows.reduce((sum, d) => sum + (Number(d.strauchschnitt_m3) || 0), 0),
    gruen: rows.reduce((sum, d) => sum + (Number(d.gruenschnitt_m3) || 0), 0),
  };
}

export default async function AdminOverview() {
  const supabase = await createClient();

  const now = new Date();
  const dayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();

  const daysSinceMonday = (now.getDay() + 6) % 7;
  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysSinceMonday,
  ).toISOString();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const [today, week, month] = await Promise.all([
    getTotalsSince(supabase, dayStart),
    getTotalsSince(supabase, weekStart),
    getTotalsSince(supabase, monthStart),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-edaphos-black">Übersicht</h1>

      <StatsSection title="Heute" totals={today} />
      <StatsSection title="Diese Woche" totals={week} />
      <StatsSection title="Diesen Monat" totals={month} />
    </div>
  );
}

function StatsSection({ title, totals }: { title: string; totals: Totals }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-neutral-500">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Anlieferungen" value={totals.count.toString()} />
        <StatCard label="Strauchschnitt (m³)" value={totals.strauch.toFixed(2)} />
        <StatCard label="Grünschnitt (m³)" value={totals.gruen.toFixed(2)} />
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
