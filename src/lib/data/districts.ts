import { createClient } from "@/lib/supabase/server";

export type MunicipalityOption = {
  id: string;
  name: string;
  isCatchAll: boolean;
};

export type DistrictOption = {
  id: string;
  name: string;
  municipalities: MunicipalityOption[];
};

export async function getDistrictsWithMunicipalities(): Promise<
  DistrictOption[]
> {
  const supabase = await createClient();

  const { data: districts, error: districtsError } = await supabase
    .from("districts")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true });

  if (districtsError || !districts) {
    throw new Error("Bezirke konnten nicht geladen werden.");
  }

  const { data: municipalities, error: municipalitiesError } = await supabase
    .from("municipalities")
    .select("id, name, district_id, sort_order, is_catch_all")
    .order("sort_order", { ascending: true });

  if (municipalitiesError || !municipalities) {
    throw new Error("Gemeinden konnten nicht geladen werden.");
  }

  return districts.map((district) => ({
    id: district.id,
    name: district.name,
    municipalities: municipalities
      .filter((m) => m.district_id === district.id)
      .map((m) => ({ id: m.id, name: m.name, isCatchAll: m.is_catch_all })),
  }));
}
