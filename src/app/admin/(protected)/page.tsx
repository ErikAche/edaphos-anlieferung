import { createClient } from "@/lib/supabase/server";
import DeliveryChart, { type DailyPoint } from "./DeliveryChart";

type Totals = { count: number; strauch: number; gruen: number };

const CHART_DAYS = 14;

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function getLastNDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  days: number,
): Promise<DailyPoint[]> {
  const now = new Date();
  const rangeStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (days - 1),
  );

  const { data } = await supabase
    .from("deliveries")
    .select("created_at, strauchschnitt_m3, gruenschnitt_m3")
    .is("deleted_at", null)
    .gte("created_at", rangeStart.toISOString());

  const buckets = new Map<string, { strauch: number; gruen: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    buckets.set(localDateKey(d), { strauch: 0, gruen: 0 });
  }

  for (const row of data ?? []) {
    const key = localDateKey(new Date(row.created_at));
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.strauch += Number(row.strauchschnitt_m3) || 0;
    bucket.gruen += Number(row.gruenschnitt_m3) || 0;
  }

  return Array.from(buckets.entries()).map(([date, totals]) => {
    const d = new Date(date);
    return {
      date,
      label: d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" }),
      strauch: Math.round(totals.strauch * 100) / 100,
      gruen: Math.round(totals.gruen * 100) / 100,
    };
  });
}

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

  const [today, week, month, dailyData] = await Promise.all([
    getTotalsSince(supabase, dayStart),
    getTotalsSince(supabase, weekStart),
    getTotalsSince(supabase, monthStart),
    getLastNDays(supabase, CHART_DAYS),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-edaphos-black">Übersicht</h1>

      <StatsSection title="Heute" totals={today} />
      <StatsSection title="Diese Woche" totals={week} />
      <StatsSection title="Diesen Monat" totals={month} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-500">
          Letzte {CHART_DAYS} Tage
        </h2>
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <DeliveryChart data={dailyData} />
        </div>
      </div>
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
