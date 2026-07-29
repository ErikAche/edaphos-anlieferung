"use client";

import { useActionState } from "react";
import { updateBillingEmail, type ActionResult } from "@/lib/actions/settings";

const initialState: ActionResult = { success: false };

export default function SettingsForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateBillingEmail,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        defaultValue={currentEmail}
        className="rounded-lg border border-neutral-300 px-3 py-2"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-edaphos-green">Gespeichert.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-edaphos-green px-4 py-1.5 text-sm font-semibold text-white hover:bg-edaphos-green-dark disabled:bg-neutral-300"
      >
        {pending ? "Speichert…" : "Speichern"}
      </button>
    </form>
  );
}
