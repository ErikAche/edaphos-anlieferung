import { createClient } from "@/lib/supabase/server";

export type DeliveryFilters = {
  from?: string;
  to?: string;
  districtId?: string;
  municipalityId?: string;
  name?: string;
};

export async function listDeliveries(filters: DeliveryFilters = {}) {
  const supabase = await createClient();

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
  if (filters.name) {
    query = query.or(
      `first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`,
    );
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
