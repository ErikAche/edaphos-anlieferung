"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateDeliveryInput = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  houseNumber: string;
  strauchschnittM3: number | null;
  gruenschnittM3: number | null;
};

export type ActionResult = { success: boolean; error?: string };

export async function updateDelivery(
  input: UpdateDeliveryInput,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht angemeldet." };

  const { data: existing, error: fetchError } = await supabase
    .from("deliveries")
    .select(
      "first_name, last_name, street, house_number, strauchschnitt_m3, gruenschnitt_m3",
    )
    .eq("id", input.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Anlieferung nicht gefunden." };
  }

  const newValues = {
    first_name: input.firstName,
    last_name: input.lastName,
    street: input.street,
    house_number: input.houseNumber,
    strauchschnitt_m3: input.strauchschnittM3,
    gruenschnitt_m3: input.gruenschnittM3,
  };

  const { error: updateError } = await supabase
    .from("deliveries")
    .update({ ...newValues, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", input.id);

  if (updateError) {
    return { success: false, error: "Speichern fehlgeschlagen." };
  }

  await supabase.from("audit_log").insert({
    delivery_id: input.id,
    admin_user_id: user.id,
    action: "update",
    old_values: existing,
    new_values: newValues,
  });

  revalidatePath("/admin/anlieferungen");
  revalidatePath(`/admin/anlieferungen/${input.id}`);
  return { success: true };
}

export async function deleteDelivery(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nicht angemeldet." };

  const { data: existing } = await supabase
    .from("deliveries")
    .select("*")
    .eq("id", id)
    .single();

  const { error: deleteError } = await supabase
    .from("deliveries")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", id);

  if (deleteError) {
    return { success: false, error: "Löschen fehlgeschlagen." };
  }

  await supabase.from("audit_log").insert({
    delivery_id: id,
    admin_user_id: user.id,
    action: "delete",
    old_values: existing,
    new_values: null,
  });

  revalidatePath("/admin/anlieferungen");
  return { success: true };
}
