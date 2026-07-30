type DuplicateCandidate = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
};

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Findet Anlieferungen, die am selben Tag mit identischem Namen und
 * identischer Adresse erfasst wurden - Hinweis auf versehentliche
 * Doppelerfassung, kein automatisches Blockieren.
 */
export function findDuplicateDeliveryIds(
  deliveries: DuplicateCandidate[],
): Set<string> {
  const groups = new Map<string, string[]>();

  for (const d of deliveries) {
    const key = [
      dayKey(d.created_at),
      normalize(d.first_name),
      normalize(d.last_name),
      normalize(d.street),
      normalize(d.house_number),
    ].join("|");
    const existing = groups.get(key) ?? [];
    existing.push(d.id);
    groups.set(key, existing);
  }

  const duplicateIds = new Set<string>();
  for (const ids of groups.values()) {
    if (ids.length > 1) {
      for (const id of ids) duplicateIds.add(id);
    }
  }
  return duplicateIds;
}
