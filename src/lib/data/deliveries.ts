import { createClient } from "@/lib/supabase/server";

export type DeliveryFilters = {
  from?: string;
  to?: string;
  districtId?: string;
  municipalityId?: string;
  query?: string;
};

function sanitizeForFilter(value: string) {
  // Kommas/Klammern haben in PostgREST-.or()-Filtern Sonderbedeutung.
  return value.replace(/[,()]/g, " ").trim();
}

export async function listDeliveries(filters: DeliveryFilters = {}) {
  const supabase = await createClient();

  let matchingDistrictIds: string[] = [];
  let matchingMunicipalityIds: string[] = [];
  const searchTerm = filters.query ? sanitizeForFilter(filters.query) : "";

  if (searchTerm) {
    const [{ data: matchedDistricts }, { data: matchedMunicipalities }] =
      await Promise.all([
        supabase.from("districts").select("id").ilike("name", `%${searchTerm}%`),
        supabase
          .from("municipalities")
          .select("id")
          .ilike("name", `%${searchTerm}%`),
      ]);
    matchingDistrictIds = (matchedDistricts ?? []).map((d) => d.id);
    matchingMunicipalityIds = (matchedMunicipalities ?? []).map((m) => m.id);
  }

  let query = supabase
    .from("deliveries")
    .select(
      "id, created_at, district_id, municipality_id, municipality_freetext, first_name, last_name, street, house_number, strauchschnitt_m3, gruenschnitt_m3, deleted_at, districts(name), municipalities(name, is_catch_all)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lte("created_at", filters.to);
  if (filters.districtId) query = query.eq("district_id", filters.districtId);
  if (filters.municipalityId)
    query = query.eq("municipality_id", filters.municipalityId);

  if (searchTerm) {
    const orParts = [
      `first_name.ilike.%${searchTerm}%`,
      `last_name.ilike.%${searchTerm}%`,
      `street.ilike.%${searchTerm}%`,
      `municipality_freetext.ilike.%${searchTerm}%`,
    ];
    if (matchingDistrictIds.length > 0) {
      orParts.push(`district_id.in.(${matchingDistrictIds.join(",")})`);
    }
    if (matchingMunicipalityIds.length > 0) {
      orParts.push(`municipality_id.in.(${matchingMunicipalityIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  const { data, error } = await query.limit(500);
  if (error) throw new Error("Anlieferungen konnten nicht geladen werden.");
  return data;
}

export async function getDelivery(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deliveries")
    .select(
      "*, districts(name), municipalities(name, is_catch_all)",
    )
    .eq("id", id)
    .single();

  if (error) throw new Error("Anlieferung nicht gefunden.");
  return data;
}

export async function getSignedSignatureUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("signatures")
    .createSignedUrl(path, 60 * 5);

  if (error) return null;
  return data.signedUrl;
}

export async function getAuditLogForDelivery(deliveryId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("delivery_id", deliveryId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Audit-Log konnte nicht geladen werden.");
  return data;
}
