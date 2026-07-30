// Supabase Edge Function: monthly-export
// Läuft am 1. jedes Monats (via pg_cron), erstellt eine Excel-Abrechnung
// für den Vormonat (alle Bezirke/Gemeinden als Tabellenblätter) und
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

function sanitizeSheetName(name: string) {
  return name.replace(/[[\]:\\/?*]/g, "").slice(0, 31);
}

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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "EDAPHOS Anlieferungserfassung";
    workbook.created = new Date();

    for (const district of districts ?? []) {
      const districtMunicipalities = (municipalities ?? []).filter(
        (m) => m.district_id === district.id,
      );

      const sheetTargets =
        districtMunicipalities.length > 0
          ? districtMunicipalities.map((m) => ({ name: m.name, id: m.id as string | null }))
          : [{ name: null, id: null }];

      for (const target of sheetTargets) {
        const rows = (deliveries ?? []).filter((d) => {
          if (d.district_id !== district.id) return false;
          if (target.id === null) return !d.municipality_id;
          return d.municipality_id === target.id;
        });

        const sheetName = sanitizeSheetName(
          target.name ? `${district.name} - ${target.name}` : district.name,
        );
        const sheet = workbook.addWorksheet(sheetName);
        sheet.addRow(HEADERS).font = { bold: true };
        sheet.columns = HEADERS.map(() => ({ width: 18 }));

        for (const row of rows) {
          const matchedMunicipality = (municipalities ?? []).find(
            (m) => m.id === row.municipality_id,
          );
          const municipalityName = matchedMunicipality?.is_catch_all
            ? (row.municipality_freetext ?? matchedMunicipality.name)
            : (matchedMunicipality?.name ?? row.municipality_freetext ?? "");
          sheet.addRow([
            district.name,
            municipalityName,
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
      }
    }

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
