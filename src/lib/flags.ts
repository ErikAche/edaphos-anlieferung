export const SUSPICIOUS_AMOUNT_THRESHOLD_M3 = 5;

export function isSuspiciousDelivery(
  strauchschnittM3: number | null,
  gruenschnittM3: number | null,
): boolean {
  return (
    (strauchschnittM3 ?? 0) >= SUSPICIOUS_AMOUNT_THRESHOLD_M3 ||
    (gruenschnittM3 ?? 0) >= SUSPICIOUS_AMOUNT_THRESHOLD_M3
  );
}
