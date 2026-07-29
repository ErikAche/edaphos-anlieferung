"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const BILLING_EMAIL_KEY = "billing_email";
const RESEND_API_KEY_KEY = "resend_api_key";

export async function getBillingEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", BILLING_EMAIL_KEY)
    .maybeSingle();
  return data?.value ?? null;
}

export async function isResendApiKeyConfigured(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", RESEND_API_KEY_KEY)
    .maybeSingle();
  return Boolean(data?.value);
}

export type ActionResult = { success: boolean; error?: string };

export async function updateBillingEmail(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Bitte eine gültige E-Mail-Adresse angeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: BILLING_EMAIL_KEY, value: email, updated_at: new Date().toISOString() });

  if (error) {
    return { success: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/admin/einstellungen");
  return { success: true };
}

export async function updateResendApiKey(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const apiKey = String(formData.get("resendApiKey") ?? "").trim();
  if (!apiKey || !apiKey.startsWith("re_")) {
    return { success: false, error: "Bitte einen gültigen Resend API-Key angeben (beginnt mit re_)." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: RESEND_API_KEY_KEY, value: apiKey, updated_at: new Date().toISOString() });

  if (error) {
    return { success: false, error: "Speichern fehlgeschlagen." };
  }

  revalidatePath("/admin/einstellungen");
  return { success: true };
}
