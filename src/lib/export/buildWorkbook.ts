import ExcelJS from "exceljs";

export type ExportDelivery = {
  created_at: string;
  district_id: string;
  district_name: string;
  municipality_id: string | null;
  municipality_display_name: string;
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
  strauchschnitt_m3: number | null;
  gruenschnitt_m3: number | null;
};

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

export async function buildDeliveriesWorkbook(
  deliveries: ExportDelivery[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EDAPHOS Anlieferungserfassung";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Anlieferungen");
  sheet.addRow(HEADERS).font = { bold: true };
  sheet.columns = HEADERS.map(() => ({ width: 18 }));

  // Erste Zeile beim Scrollen fixiert lassen.
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const sorted = [...deliveries].sort((a, b) => {
    const district = a.district_name.localeCompare(b.district_name, "de");
    if (district !== 0) return district;
    const municipality = a.municipality_display_name.localeCompare(
      b.municipality_display_name,
      "de",
    );
    if (municipality !== 0) return municipality;
    return (
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  });

  for (const row of sorted) {
    sheet.addRow([
      row.district_name,
      row.municipality_display_name,
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

  if (sorted.length === 0) {
    sheet.addRow(["Keine Anlieferungen in diesem Zeitraum."]);
  }

  // Filter-Dropdowns in der Kopfzeile ueber alle Spalten.
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: HEADERS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
