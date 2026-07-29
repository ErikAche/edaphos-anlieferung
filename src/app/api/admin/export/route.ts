import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildDeliveriesWorkbook,
  type ExportSheetDefinition,
} from "@/lib/export/buildWorkbook";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Kein Admin-Zugriff." }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const districtId = searchParams.get("districtId") || undefined;
  const municipalityId = searchParams.get("municipalityId") || undefined;

  if (!from || !to) {
    return NextResponse.json(
      { error: "Zeitraum (von/bis) ist erforderlich." },
      { status: 400 },
    );
  }

  const { data: districts } = await supabase
    .from("districts")
    .select("id, name, sort_order")
    .order("sort_order");
  const { data: municipalities } = await supabase
    .from("municipalities")
    .select("id, name, district_id, sort_order")
    .order("sort_order");

  let query = supabase
    .from("deliveries")
    .select(
      "created_at, district_id, municipality_id, municipality_freetext, first_name, last_name, street, house_number, strauchschnitt_m3, gruenschnitt_m3",
    )
    .is("deleted_at", null)
    .gte("created_at", from)
    .lte("created_at", to);

  if (districtId) query = query.eq("district_id", districtId);
  if (municipalityId) query = query.eq("municipality_id", municipalityId);

  const { data: rawDeliveries, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Daten konnten nicht geladen werden." },
      { status: 500 },
    );
  }

  const districtById = new Map((districts ?? []).map((d) => [d.id, d]));
  const municipalityById = new Map(
    (municipalities ?? []).map((m) => [m.id, m]),
  );

  const deliveries = (rawDeliveries ?? []).map((d) => ({
    created_at: d.created_at,
    district_name: districtById.get(d.district_id)?.name ?? "Unbekannt",
    municipality_name: d.municipality_id
      ? (municipalityById.get(d.municipality_id)?.name ?? null)
      : null,
    municipality_freetext: d.municipality_freetext,
    first_name: d.first_name,
    last_name: d.last_name,
    street: d.street,
    house_number: d.house_number,
    strauchschnitt_m3: d.strauchschnitt_m3,
    gruenschnitt_m3: d.gruenschnitt_m3,
  }));

  const relevantDistricts = districtId
    ? (districts ?? []).filter((d) => d.id === districtId)
    : (districts ?? []);

  const sheetDefinitions = relevantDistricts.flatMap(
    (district): ExportSheetDefinition[] => {
      const districtMunicipalities = (municipalities ?? []).filter(
        (m) =>
          m.district_id === district.id &&
          (!municipalityId || m.id === municipalityId),
      );
      if (districtMunicipalities.length === 0) {
        return [{ districtName: district.name, municipalityName: null }];
      }
      return districtMunicipalities.map((m) => ({
        districtName: district.name,
        municipalityName: m.name,
      }));
    },
  );

  const buffer = await buildDeliveriesWorkbook(deliveries, sheetDefinitions);
  const filename = `edaphos-anlieferungen_${from}_bis_${to}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
