import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BezirkGemeindeChart, { type BreakdownRow } from "./BezirkGemeindeChart";

type Totals = { count: number; strauch: number; gruen: number };
type Period = "month" | "quarter" | "year";

const PERIOD_LABELS: Record<Period, string> = {
  month: "Diesen Monat",
  quarter: "Dieses Quartal",
  year: "Dieses Jahr",
};

function getPeriodStart(period: Period, now: Date): Date {
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterStartMonth, 1);
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

async function getDistrictBreakdown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  since: string,
): Promise<BreakdownRow[]> {
  const [{ data: districts }, { data: municipalities }, { data: deliveries }] =
    await Promise.all([
      supabase.from("districts").select("id, name, sort_order").order("sort_order"),
      supabase
        .from("municipalities")
        .select("id, name, district_id, sort_order")
        .order("sort_order"),
      supabase
        .from("deliveries")
        .select("district_id, municipality_id, strauchschnitt_m3, gruenschnitt_m3")
        .is("deleted_at", null)
        .gte("created_at", since),
    ]);

  const districtById = new Map((districts ?? []).map((d) => [d.id, d]));

  const totalsByKey = new Map<string, { strauch: number; gruen: number }>();
  for (const d of deliveries ?? []) {
    const key = `${d.district_id}|${d.municipality_id}`;
    const t = totalsByKey.get(key) ?? { strauch: 0, gruen: 0 };
    t.strauch += Number(d.strauchschnitt_m3) || 0;
    t.gruen += Number(d.gruenschnitt_m3) || 0;
    totalsByKey.set(key, t);
  }

  const rows = (municipalities ?? [])
    .map((m) => {
      const t = totalsByKey.get(`${m.district_id}|${m.id}`);
      if (!t) return null;
      return {
        label: `${districtById.get(m.district_id)?.name ?? ""} – ${m.name}`,
        strauch: Math.round(t.strauch * 100) / 100,
        gruen: Math.round(t.gruen * 100) / 100,
        districtSort: districtById.get(m.district_id)?.sort_order ?? 0,
        municipalitySort: m.sort_order,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort(
      (a, b) =>
        a.districtSort - b.districtSort || a.municipalitySort - b.municipalitySort,
    );

  return rows.map(({ label, strauch, gruen }) => ({ label, strauch, gruen }));
}

export default async function AdminOverview({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const period: Period =
    params.period === "month" || params.period === "year" ? params.period : "quarter";

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

  const periodStart = getPeriodStart(period, now).toISOString();

  const [today, week, month, breakdown] = await Promise.all([
    getTotalsSince(supabase, dayStart),
    getTotalsSince(supabase, weekStart),
    getTotalsSince(supabase, monthStart),
    getDistrictBreakdown(supabase, periodStart),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-edaphos-black">Übersicht</h1>

      <StatsSection title="Heute" totals={today} />
      <StatsSection title="Diese Woche" totals={week} />
      <StatsSection title="Diesen Monat" totals={month} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-500">
            Anlieferungen pro Bezirk &amp; Gemeinde
          </h2>
          <div className="flex gap-2">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <Link
                key={p}
                href={`/admin?period=${p}`}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  p === period
                    ? "bg-edaphos-green text-white"
                    : "border border-neutral-300 text-neutral-600 hover:border-edaphos-green"
                }`}
              >
                {PERIOD_LABELS[p]}
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <BezirkGemeindeChart rows={breakdown} />
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
