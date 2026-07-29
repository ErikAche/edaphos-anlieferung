import { headers } from "next/headers";
import QRCode from "qrcode";

export default async function QrPage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const url = `${protocol}://${host}/`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 480,
    margin: 2,
    color: { dark: "#111111", light: "#ffffff" },
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-10 text-center">
      <span className="text-2xl font-black text-edaphos-green">EDAPHOS</span>
      <h1 className="text-xl font-bold text-edaphos-black">
        Anlieferung mit dem Smartphone erfassen
      </h1>
      <p className="text-sm text-neutral-500">
        QR-Code scannen, um die Anlieferung alternativ am eigenen Smartphone
        einzutragen.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="QR-Code zur Anlieferungserfassung"
        className="h-72 w-72 rounded-xl border border-neutral-200"
      />
      <p className="text-xs text-neutral-400 break-all">{url}</p>
    </div>
  );
}
