import { getBillingEmail, isResendApiKeyConfigured } from "@/lib/actions/settings";
import SettingsForm from "./SettingsForm";
import ResendApiKeyForm from "./ResendApiKeyForm";

export default async function EinstellungenPage() {
  const billingEmail = await getBillingEmail();
  const resendConfigured = await isResendApiKeyConfigured();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-edaphos-black dark:text-neutral-100">
        Einstellungen
      </h1>
      <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Abrechnungs-E-Mail-Adresse
        </h2>
        <p className="mb-4 text-sm text-neutral-400 dark:text-neutral-500">
          An diese Adresse wird am 1. jedes Monats automatisch die
          Excel-Abrechnung des Vormonats geschickt.
        </p>
        <SettingsForm currentEmail={billingEmail ?? ""} />
      </div>
      <div className="max-w-md rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Resend API-Key
        </h2>
        <p className="mb-4 text-sm text-neutral-400 dark:text-neutral-500">
          Wird für den automatischen Mailversand der Monatsabrechnung
          verwendet. Status:{" "}
          <span
            className={resendConfigured ? "text-edaphos-green" : "text-red-600"}
          >
            {resendConfigured ? "hinterlegt" : "nicht hinterlegt"}
          </span>
        </p>
        <ResendApiKeyForm />
      </div>
    </div>
  );
}
