export function resolveMunicipalityDisplayName(
  municipality: { name: string; is_catch_all: boolean } | null | undefined,
  freetext: string | null | undefined,
): string {
  if (municipality?.is_catch_all) {
    return freetext || municipality.name;
  }
  return municipality?.name ?? freetext ?? "";
}
