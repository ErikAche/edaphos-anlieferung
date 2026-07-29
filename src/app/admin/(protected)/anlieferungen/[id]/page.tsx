import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAuditLogForDelivery,
  getDelivery,
  getSignedSignatureUrl,
} from "@/lib/data/deliveries";
import DeliveryDetail from "./DeliveryDetail";

export default async function DeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let delivery;
  try {
    delivery = await getDelivery(id);
  } catch {
    notFound();
  }

  const [signatureUrl, auditLog] = await Promise.all([
    getSignedSignatureUrl(delivery.signature_path),
    getAuditLogForDelivery(id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/anlieferungen" className="text-sm text-edaphos-green underline">
        ← Zurück zur Übersicht
      </Link>
      <DeliveryDetail
        delivery={delivery}
        signatureUrl={signatureUrl}
        auditLog={auditLog}
      />
    </div>
  );
}
