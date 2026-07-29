import Link from "next/link";
import DeliveryWizard from "@/components/wizard/DeliveryWizard";
import { getDistrictsWithMunicipalities } from "@/lib/data/districts";

export default async function Home() {
  const districts = await getDistrictsWithMunicipalities();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col items-center gap-1 text-center">
        <span className="text-2xl font-black tracking-tight text-edaphos-green">
          EDAPHOS
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Biologische Humuserde
        </span>
      </header>

      <main className="flex-1">
        <DeliveryWizard districts={districts} />
      </main>

      <footer className="text-center text-xs text-neutral-400">
        Mit dem Absenden willigen Sie in die Verarbeitung Ihrer Daten gemäß{" "}
        <Link href="/datenschutz" className="underline">
          Datenschutzerklärung
        </Link>{" "}
        ein.
      </footer>
    </div>
  );
}
