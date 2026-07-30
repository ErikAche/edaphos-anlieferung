// Supabase Edge Function: monthly-export
// Läuft am 1. jedes Monats (via pg_cron), erstellt eine Excel-Abrechnung
// für den Vormonat (eine Tabelle, Kopfzeile fixiert, Filter aktiviert) und
// verschickt sie per Resend an die in `settings` hinterlegte E-Mail-Adresse.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import ExcelJS from "npm:exceljs@4";

const HEADERS = [
  "Bezirk",
  "Gemeinde",
  "Datum",
  "Vorname",
  "Nachname",
  "Straße",
  "Hausnummer",
  "Strauchschnitt (m³)",
  "Grünschnitt (m³)",
  "Unterschrieben",
];

function previousMonthRange() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const label = from.toLocaleDateString("de-AT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { from: from.toISOString(), to: to.toISOString(), label };
}

Deno.serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: resendKeySetting, error: resendKeyError } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "resend_api_key")
      .maybeSingle();

    if (resendKeyError || !resendKeySetting?.value) {
      throw new Error("Kein Resend API-Key in den Einstellungen hinterlegt.");
    }
    const resendApiKey = resendKeySetting.value;

    const { data: billingEmailSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "billing_email")
      .maybeSingle();

    if (!billingEmailSetting?.value) {
      throw new Error("Keine Abrechnungs-E-Mail-Adresse in den Einstellungen hinterlegt.");
    }
    const billingEmail = billingEmailSetting.value;

    const { from, to, label } = previousMonthRange();

    const [{ data: districts }, { data: municipalities }, { data: deliveries }] =
      await Promise.all([
        supabase.from("districts").select("id, name, sort_order").order("sort_order"),
        supabase
          .from("municipalities")
          .select("id, name, district_id, sort_order, is_catch_all")
          .order("sort_order"),
        supabase
          .from("deliveries")
          .select(
            "created_at, district_id, municipality_id, municipality_freetext, first_name, last_name, street, house_number, strauchschnitt_m3, gruenschnitt_m3",
          )
          .is("deleted_at", null)
          .gte("created_at", from)
          .lt("created_at", to),
      ]);

    const districtById = new Map((districts ?? []).map((d) => [d.id, d]));
    const municipalityById = new Map((municipalities ?? []).map((m) => [m.id, m]));

    const rows = (deliveries ?? []).map((d) => {
      const municipality = d.municipality_id ? municipalityById.get(d.municipality_id) : undefined;
      const municipalityName = municipality?.is_catch_all
        ? (d.municipality_freetext ?? municipality.name)
        : (municipality?.name ?? d.municipality_freetext ?? "");
      return {
        districtName: districtById.get(d.district_id)?.name ?? "Unbekannt",
        municipalityName,
        created_at: d.created_at,
        first_name: d.first_name,
        last_name: d.last_name,
        street: d.street,
        house_number: d.house_number,
        strauchschnitt_m3: d.strauchschnitt_m3,
        gruenschnitt_m3: d.gruenschnitt_m3,
      };
    });

    rows.sort((a, b) => {
      const district = a.districtName.localeCompare(b.districtName, "de");
      if (district !== 0) return district;
      const municipality = a.municipalityName.localeCompare(b.municipalityName, "de");
      if (municipality !== 0) return municipality;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EDAPHOS Anlieferungserfassung";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Anlieferungen");
    sheet.addRow(HEADERS).font = { bold: true };
    sheet.columns = HEADERS.map(() => ({ width: 18 }));
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    for (const row of rows) {
      sheet.addRow([
        row.districtName,
        row.municipalityName,
        new Date(row.created_at).toLocaleString("de-AT"),
        row.first_name,
        row.last_name,
        row.street,
        row.house_number,
        row.strauchschnitt_m3 ?? "",
        row.gruenschnitt_m3 ?? "",
        "Ja",
      ]);
    }
    if (rows.length === 0) {
      sheet.addRow(["Keine Anlieferungen in diesem Zeitraum."]);
    }

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: HEADERS.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
    );

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "EDAPHOS Anlieferung <office@anlieferung-edaphos.at>",
        to: [billingEmail],
        subject: `EDAPHOS Monatsabrechnung – ${label}`,
        text: `Im Anhang die Anlieferungs-Abrechnung für ${label}.`,
        attachments: [
          {
            filename: `edaphos-abrechnung_${label.replace(" ", "_")}.xlsx`,
            content: base64,
          },
        ],
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text();
      throw new Error(`Resend-Versand fehlgeschlagen: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true, period: label }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
