"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { deliverySchema } from "@/lib/validation/delivery";

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return headerList.get("x-real-ip") ?? "unknown";
}

export type SubmitDeliveryState = {
  success: boolean;
  error?: string;
};

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

export async function submitDelivery(
  input: unknown,
): Promise<SubmitDeliveryState> {
  const parsed = deliverySchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe.",
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const ip = await getClientIp();
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    "check_delivery_rate_limit",
    { p_ip: ip },
  );

  if (rateLimitError || !allowed) {
    return {
      success: false,
      error:
        "Zu viele Anlieferungen von dieser Verbindung in kurzer Zeit. Bitte versuchen Sie es später erneut.",
    };
  }

  const { data: municipality, error: municipalityError } = await supabase
    .from("municipalities")
    .select("id, district_id, is_catch_all")
    .eq("id", data.municipalityId)
    .single();

  if (
    municipalityError ||
    !municipality ||
    municipality.district_id !== data.districtId
  ) {
    return { success: false, error: "Ungültige Gemeinde für den gewählten Bezirk." };
  }

  if (municipality.is_catch_all && !data.municipalityFreetext?.trim()) {
    return { success: false, error: "Bitte den Namen Ihrer Gemeinde eintragen." };
  }

  const municipalityFreetext = municipality.is_catch_all
    ? (data.municipalityFreetext?.trim() ?? null)
    : null;

  const signatureBuffer = dataUrlToBuffer(data.signatureDataUrl);
  const signaturePath = `${data.districtId}/${randomUUID()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("signatures")
    .upload(signaturePath, signatureBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: "Unterschrift konnte nicht gespeichert werden." };
  }

  const { error: insertError } = await supabase.from("deliveries").insert({
    delivery_type: data.deliveryType,
    district_id: data.districtId,
    municipality_id: data.municipalityId,
    municipality_freetext: municipalityFreetext,
    first_name: data.firstName,
    last_name: data.lastName,
    street: data.street,
    house_number: data.houseNumber,
    strauchschnitt_m3: data.strauchschnittM3 ?? null,
    gruenschnitt_m3: data.gruenschnittM3 ?? null,
    signature_path: signaturePath,
  });

  if (insertError) {
    // Verwaistes Unterschrift-Bild aufräumen, falls der Insert fehlschlägt
    await supabase.storage.from("signatures").remove([signaturePath]);
    return { success: false, error: "Anlieferung konnte nicht gespeichert werden." };
  }

  return { success: true };
}
