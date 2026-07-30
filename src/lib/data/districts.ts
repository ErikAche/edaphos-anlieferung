import { createClient } from "@/lib/supabase/server";

export type MunicipalityOption = {
  id: string;
  name: string;
};

export type DistrictOption = {
  id: string;
  name: string;
  isCatchAll: boolean;
  municipalities: MunicipalityOption[];
};

export async function getDistrictsWithMunicipalities(): Promise<
  DistrictOption[]
> {
  console.error(
    "getDistrictsWithMunicipalities env check:",
    JSON.stringify({
      SUPABASE_URL: process.env.SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
      hasNextPublicAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    }),
  );

  const supabase = await createClient();

  const { data: districts, error: districtsError } = await supabase
    .from("districts")
    .select("id, name, is_catch_all, sort_order")
    .order("sort_order", { ascending: true });

  if (districtsError || !districts) {
    console.error("getDistrictsWithMunicipalities districts error:", districtsError);
    throw new Error("Bezirke konnten nicht geladen werden.");
  }

  const { data: municipalities, error: municipalitiesError } = await supabase
    .from("municipalities")
    .select("id, name, district_id, sort_order")
    .order("sort_order", { ascending: true });

  if (municipalitiesError || !municipalities) {
    console.error("getDistrictsWithMunicipalities municipalities error:", municipalitiesError);
    throw new Error("Gemeinden konnten nicht geladen werden.");
  }

  return districts.map((district) => ({
    id: district.id,
    name: district.name,
    isCatchAll: district.is_catch_all,
    municipalities: municipalities
      .filter((m) => m.district_id === district.id)
      .map((m) => ({ id: m.id, name: m.name })),
  }));
}
