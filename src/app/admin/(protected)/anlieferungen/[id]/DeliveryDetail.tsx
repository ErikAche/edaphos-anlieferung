"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteDelivery,
  updateDelivery,
} from "@/lib/actions/admin-deliveries";
import type { Tables } from "@/lib/types/database";

type Delivery = Tables<"deliveries"> & {
  districts: { name: string } | null;
  municipalities: { name: string } | null;
};

type AuditLogEntry = Tables<"audit_log">;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeliveryDetail({
  delivery,
  signatureUrl,
  auditLog,
}: {
  delivery: Delivery;
  signatureUrl: string | null;
  auditLog: AuditLogEntry[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: delivery.first_name,
    lastName: delivery.last_name,
    street: delivery.street,
    houseNumber: delivery.house_number,
    strauchschnitt: delivery.strauchschnitt_m3?.toString() ?? "",
    gruenschnitt: delivery.gruenschnitt_m3?.toString() ?? "",
  });

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateDelivery({
      id: delivery.id,
      firstName: form.firstName,
      lastName: form.lastName,
      street: form.street,
      houseNumber: form.houseNumber,
      strauchschnittM3: form.strauchschnitt
        ? Number(form.strauchschnitt.replace(",", "."))
        : null,
      gruenschnittM3: form.gruenschnitt
        ? Number(form.gruenschnitt.replace(",", "."))
        : null,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error ?? "Fehler beim Speichern.");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Diese Anlieferung wirklich löschen?")) return;
    const result = await deleteDelivery(delivery.id);
    if (!result.success) {
      setError(result.error ?? "Fehler beim Löschen.");
      return;
    }
    router.push("/admin/anlieferungen");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-edaphos-black">
              Anlieferung vom {formatDate(delivery.created_at)}
            </h1>
            {!editing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:border-edaphos-green"
                >
                  Bearbeiten
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Löschen
                </button>
              </div>
            )}
          </div>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          {!editing ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Field label="Bezirk" value={delivery.districts?.name ?? "-"} />
              <Field
                label="Gemeinde"
                value={
                  delivery.municipalities?.name ??
                  delivery.municipality_freetext ??
                  "-"
                }
              />
              <Field
                label="Name"
                value={`${delivery.first_name} ${delivery.last_name}`}
              />
              <Field
                label="Adresse"
                value={`${delivery.street} ${delivery.house_number}`}
              />
              <Field
                label="Strauchschnitt"
                value={
                  delivery.strauchschnitt_m3
                    ? `${delivery.strauchschnitt_m3} m³`
                    : "-"
                }
              />
              <Field
                label="Grünschnitt"
                value={
                  delivery.gruenschnitt_m3
                    ? `${delivery.gruenschnitt_m3} m³`
                    : "-"
                }
              />
            </dl>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <EditField
                  label="Vorname"
                  value={form.firstName}
                  onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                />
                <EditField
                  label="Nachname"
                  value={form.lastName}
                  onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                />
                <EditField
                  label="Straße"
                  value={form.street}
                  onChange={(v) => setForm((f) => ({ ...f, street: v }))}
                />
                <EditField
                  label="Hausnummer"
                  value={form.houseNumber}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, houseNumber: v }))
                  }
                />
                <EditField
                  label="Strauchschnitt (m³)"
                  value={form.strauchschnitt}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, strauchschnitt: v }))
                  }
                />
                <EditField
                  label="Grünschnitt (m³)"
                  value={form.gruenschnitt}
                  onChange={(v) =>
                    setForm((f) => ({ ...f, gruenschnitt: v }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-edaphos-green px-4 py-1.5 text-sm font-semibold text-white hover:bg-edaphos-green-dark disabled:bg-neutral-300"
                >
                  {saving ? "Speichert…" : "Speichern"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-neutral-500">
            Änderungsverlauf
          </h2>
          {auditLog.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Keine Änderungen seit der Erfassung.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {auditLog.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                >
                  <span className="font-medium">
                    {entry.action === "update" ? "Bearbeitet" : "Gelöscht"}
                  </span>{" "}
                  am {formatDate(entry.created_at)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-neutral-500">
          Unterschrift
        </h2>
        {signatureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signatureUrl}
            alt="Unterschrift"
            className="w-full rounded-lg border border-neutral-200 bg-white"
          />
        ) : (
          <p className="text-sm text-neutral-400">
            Unterschrift konnte nicht geladen werden.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-edaphos-black">{value}</dd>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-neutral-300 px-2 py-1.5"
      />
    </label>
  );
}
