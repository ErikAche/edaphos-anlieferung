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

export type ExportSheetDefinition = {
  districtId: string;
  municipalityId: string | null;
  sheetTitle: string;
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

function sanitizeSheetName(name: string) {
  return name.replace(/[[\]:\\/?*]/g, "").slice(0, 31);
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: ExportDelivery[],
) {
  const sheet = workbook.addWorksheet(sanitizeSheetName(name));
  sheet.addRow(HEADERS).font = { bold: true };
  sheet.columns = HEADERS.map(() => ({ width: 18 }));

  for (const row of rows) {
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

  if (rows.length === 0) {
    sheet.addRow(["Keine Anlieferungen in diesem Zeitraum."]);
  }
}

export async function buildDeliveriesWorkbook(
  deliveries: ExportDelivery[],
  sheetDefinitions: ExportSheetDefinition[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EDAPHOS Anlieferungserfassung";
  workbook.created = new Date();

  for (const def of sheetDefinitions) {
    const rows = deliveries.filter(
      (d) =>
        d.district_id === def.districtId &&
        d.municipality_id === def.municipalityId,
    );
    addSheet(workbook, def.sheetTitle, rows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
