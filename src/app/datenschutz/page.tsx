import Link from "next/link";

export default function Datenschutz() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-edaphos-green underline">
        ← Zurück zur Anlieferung
      </Link>
      <h1 className="text-2xl font-bold text-edaphos-black">
        Datenschutzerklärung
      </h1>
      <p className="text-neutral-700">
        Verantwortlicher für die Verarbeitung Ihrer Daten im Rahmen dieser
        Anlieferungserfassung ist EDAPHOS – Biologische Humuserde.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-edaphos-black">
          Welche Daten werden verarbeitet?
        </h2>
        <p className="text-neutral-700">
          Bezirk, Gemeinde, Datum, Vor- und Nachname, Adresse, die
          angelieferten Mengen (Strauch-/Grünschnitt) sowie Ihre Unterschrift.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-edaphos-black">
          Zweck der Verarbeitung
        </h2>
        <p className="text-neutral-700">
          Die Daten werden zur Dokumentation und Abrechnung von Anlieferungen
          an der Kompostieranlage verarbeitet (Erfüllung eines Vertrags bzw.
          berechtigtes Interesse an einer ordnungsgemäßen Betriebsführung).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-edaphos-black">
          Speicherdauer
        </h2>
        <p className="text-neutral-700">
          Die Daten werden entsprechend der gesetzlichen Aufbewahrungspflicht
          für geschäftliche Unterlagen (7 Jahre) gespeichert.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-edaphos-black">
          Ihre Rechte
        </h2>
        <p className="text-neutral-700">
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung und
          Einschränkung der Verarbeitung Ihrer Daten. Wenden Sie sich dazu
          bitte direkt an den Betreiber der Anlage.
        </p>
      </section>
    </div>
  );
}
