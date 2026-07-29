import { getDistrictsWithMunicipalities } from "@/lib/data/districts";
import ExportForm from "./ExportForm";

export default async function ExportPage() {
  const districts = await getDistrictsWithMunicipalities();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-edaphos-black">Export</h1>
      <div className="max-w-lg rounded-xl border border-neutral-200 bg-white p-6">
        <ExportForm districts={districts} />
      </div>
    </div>
  );
}
