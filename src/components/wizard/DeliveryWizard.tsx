"use client";

import { useMemo, useRef, useState } from "react";
import type { DistrictOption } from "@/lib/data/districts";
import { submitDelivery } from "@/lib/actions/deliveries";
import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";
import {
  BigChoiceButton,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  StepHeading,
  TextField,
} from "./ui";

type Step =
  | "bezirk"
  | "gemeinde"
  | "name"
  | "adresse"
  | "mengen"
  | "unterschrift"
  | "review"
  | "erfolg";

const STEP_ORDER: Step[] = [
  "bezirk",
  "gemeinde",
  "name",
  "adresse",
  "mengen",
  "unterschrift",
  "review",
];

function emptyForm() {
  return {
    districtId: "",
    municipalityId: "",
    municipalityFreetext: "",
    firstName: "",
    lastName: "",
    street: "",
    houseNumber: "",
    strauchschnitt: "",
    gruenschnitt: "",
  };
}

export default function DeliveryWizard({
  districts,
}: {
  districts: DistrictOption[];
}) {
  const [step, setStep] = useState<Step>("bezirk");
  const [form, setForm] = useState(emptyForm());
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signatureRef = useRef<SignaturePadHandle>(null);

  const selectedDistrict = useMemo(
    () => districts.find((d) => d.id === form.districtId) ?? null,
    [districts, form.districtId],
  );

  const selectedMunicipality = useMemo(
    () =>
      selectedDistrict?.municipalities.find(
        (m) => m.id === form.municipalityId,
      ) ?? null,
    [selectedDistrict, form.municipalityId],
  );

  const municipalityLabel = selectedMunicipality?.isCatchAll
    ? form.municipalityFreetext
    : selectedMunicipality?.name;

  const stepIndex = STEP_ORDER.indexOf(step === "erfolg" ? "review" : step);

  function goNext() {
    const idx = STEP_ORDER.indexOf(step as Step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step as Step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  function continueFromSignature() {
    const isEmpty = signatureRef.current?.isEmpty() ?? true;
    if (!isEmpty) {
      const dataUrl = signatureRef.current?.toDataUrl();
      if (dataUrl) setSignatureDataUrl(dataUrl);
      setError(null);
      goNext();
      return;
    }
    if (signatureDataUrl) {
      // Keine neue Unterschrift gezeichnet, vorhandene wird beibehalten
      // (z.B. beim erneuten Durchlaufen des Schritts über "Zurück").
      goNext();
      return;
    }
    setError("Bitte unterschreiben, bevor Sie fortfahren.");
  }

  function reset() {
    setForm(emptyForm());
    setSignatureDataUrl(null);
    signatureRef.current?.clear();
    setError(null);
    setStep("bezirk");
  }

  async function handleSubmit() {
    setError(null);
    if (!signatureDataUrl) {
      setError("Bitte unterschreiben, bevor Sie absenden.");
      setStep("unterschrift");
      return;
    }

    setSubmitting(true);
    const result = await submitDelivery({
      districtId: form.districtId,
      municipalityId: form.municipalityId || undefined,
      municipalityFreetext: selectedMunicipality?.isCatchAll
        ? form.municipalityFreetext
        : undefined,
      firstName: form.firstName,
      lastName: form.lastName,
      street: form.street,
      houseNumber: form.houseNumber,
      strauchschnittM3: form.strauchschnitt
        ? Number(form.strauchschnitt.replace(",", "."))
        : undefined,
      gruenschnittM3: form.gruenschnitt
        ? Number(form.gruenschnitt.replace(",", "."))
        : undefined,
      signatureDataUrl,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Unbekannter Fehler beim Absenden.");
      return;
    }

    setStep("erfolg");
  }

  if (step === "erfolg") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-edaphos-green text-4xl text-white">
          ✓
        </div>
        <h1 className="text-3xl font-bold text-edaphos-black">
          Anlieferung erfasst
        </h1>
        <p className="max-w-sm text-lg text-neutral-600">
          Vielen Dank! Ihre Anlieferung wurde gespeichert.
        </p>
        <div className="w-full max-w-xs">
          <PrimaryButton onClick={reset}>Neue Anlieferung</PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ProgressBar step={stepIndex} total={STEP_ORDER.length} />

      {step === "bezirk" && (
        <div className="flex flex-col gap-4">
          <StepHeading>In welchem Bezirk sind Sie?</StepHeading>
          <div className="flex flex-col gap-3">
            {districts.map((d) => (
              <BigChoiceButton
                key={d.id}
                label={d.name}
                selected={form.districtId === d.id}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    districtId: d.id,
                    municipalityId: "",
                    municipalityFreetext: "",
                  }))
                }
              />
            ))}
          </div>
          <PrimaryButton onClick={goNext} disabled={!form.districtId}>
            Weiter
          </PrimaryButton>
        </div>
      )}

      {step === "gemeinde" && selectedDistrict && (
        <div className="flex flex-col gap-4">
          <StepHeading>In welcher Gemeinde?</StepHeading>
          <div className="flex flex-col gap-3">
            {selectedDistrict.municipalities.map((m) => (
              <BigChoiceButton
                key={m.id}
                label={m.name}
                selected={form.municipalityId === m.id}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    municipalityId: m.id,
                    municipalityFreetext: "",
                  }))
                }
              />
            ))}
          </div>
          {selectedMunicipality?.isCatchAll && (
            <TextField
              label="Wie heißt Ihre Gemeinde?"
              value={form.municipalityFreetext}
              onChange={(v) =>
                setForm((f) => ({ ...f, municipalityFreetext: v }))
              }
              autoFocus
            />
          )}
          <div className="flex flex-col gap-3">
            <PrimaryButton
              onClick={goNext}
              disabled={
                !form.municipalityId ||
                (selectedMunicipality?.isCatchAll
                  ? !form.municipalityFreetext.trim()
                  : false)
              }
            >
              Weiter
            </PrimaryButton>
            <SecondaryButton onClick={goBack}>Zurück</SecondaryButton>
          </div>
        </div>
      )}

      {step === "name" && (
        <div className="flex flex-col gap-4">
          <StepHeading>Wie ist Ihr Name?</StepHeading>
          <TextField
            label="Vorname"
            value={form.firstName}
            onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
            autoFocus
          />
          <TextField
            label="Nachname"
            value={form.lastName}
            onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
          />
          <div className="flex flex-col gap-3">
            <PrimaryButton
              onClick={goNext}
              disabled={!form.firstName.trim() || !form.lastName.trim()}
            >
              Weiter
            </PrimaryButton>
            <SecondaryButton onClick={goBack}>Zurück</SecondaryButton>
          </div>
        </div>
      )}

      {step === "adresse" && (
        <div className="flex flex-col gap-4">
          <StepHeading>Wo wohnen Sie?</StepHeading>
          <TextField
            label="Straße"
            value={form.street}
            onChange={(v) => setForm((f) => ({ ...f, street: v }))}
            autoFocus
          />
          <TextField
            label="Hausnummer"
            value={form.houseNumber}
            onChange={(v) => setForm((f) => ({ ...f, houseNumber: v }))}
          />
          <div className="flex flex-col gap-3">
            <PrimaryButton
              onClick={goNext}
              disabled={!form.street.trim() || !form.houseNumber.trim()}
            >
              Weiter
            </PrimaryButton>
            <SecondaryButton onClick={goBack}>Zurück</SecondaryButton>
          </div>
        </div>
      )}

      {step === "mengen" && (
        <div className="flex flex-col gap-4">
          <StepHeading>Wie viel liefern Sie an?</StepHeading>
          <TextField
            label="Strauchschnitt (m³)"
            value={form.strauchschnitt}
            onChange={(v) => setForm((f) => ({ ...f, strauchschnitt: v }))}
            inputMode="decimal"
            autoFocus
          />
          <TextField
            label="Grünschnitt (m³)"
            value={form.gruenschnitt}
            onChange={(v) => setForm((f) => ({ ...f, gruenschnitt: v }))}
            inputMode="decimal"
          />
          <p className="text-sm text-neutral-500">
            Bitte mindestens eine der beiden Mengen angeben. Nicht Zutreffendes
            leer lassen.
          </p>
          <div className="flex flex-col gap-3">
            <PrimaryButton
              onClick={goNext}
              disabled={
                !(
                  Number(form.strauchschnitt.replace(",", ".") || 0) > 0 ||
                  Number(form.gruenschnitt.replace(",", ".") || 0) > 0
                )
              }
            >
              Weiter
            </PrimaryButton>
            <SecondaryButton onClick={goBack}>Zurück</SecondaryButton>
          </div>
        </div>
      )}

      {step === "unterschrift" && (
        <div className="flex flex-col gap-4">
          <StepHeading>Bitte unterschreiben Sie</StepHeading>
          <SignaturePad ref={signatureRef} />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex flex-col gap-3">
            <SecondaryButton
              onClick={() => {
                signatureRef.current?.clear();
                setSignatureDataUrl(null);
              }}
            >
              Löschen
            </SecondaryButton>
            <PrimaryButton onClick={continueFromSignature}>
              Weiter
            </PrimaryButton>
            <SecondaryButton onClick={goBack}>Zurück</SecondaryButton>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col gap-4">
          <StepHeading>Bitte prüfen</StepHeading>
          <dl className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 text-lg">
            <Row label="Bezirk" value={selectedDistrict?.name ?? "-"} />
            <Row label="Gemeinde" value={municipalityLabel || "-"} />
            <Row
              label="Name"
              value={`${form.firstName} ${form.lastName}`}
            />
            <Row
              label="Adresse"
              value={`${form.street} ${form.houseNumber}`}
            />
            {form.strauchschnitt && (
              <Row label="Strauchschnitt" value={`${form.strauchschnitt} m³`} />
            )}
            {form.gruenschnitt && (
              <Row label="Grünschnitt" value={`${form.gruenschnitt} m³`} />
            )}
          </dl>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex flex-col gap-3">
            <PrimaryButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Wird gesendet…" : "Absenden"}
            </PrimaryButton>
            <SecondaryButton onClick={goBack}>Zurück</SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-4 py-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold text-edaphos-black">{value}</dd>
    </div>
  );
}
