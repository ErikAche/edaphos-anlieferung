import { z } from "zod";

export const deliverySchema = z
  .object({
    districtId: z.string().uuid({ message: "Bitte einen Bezirk wählen." }),
    municipalityId: z.string().uuid({ message: "Bitte eine Gemeinde wählen." }),
    municipalityFreetext: z.string().trim().max(120).optional(),
    firstName: z.string().trim().min(1, "Vorname ist erforderlich.").max(120),
    lastName: z.string().trim().min(1, "Nachname ist erforderlich.").max(120),
    street: z.string().trim().min(1, "Straße ist erforderlich.").max(160),
    houseNumber: z.string().trim().min(1, "Hausnummer ist erforderlich.").max(20),
    strauchschnittM3: z
      .number()
      .nonnegative()
      .multipleOf(0.01)
      .max(999)
      .optional(),
    gruenschnittM3: z
      .number()
      .nonnegative()
      .multipleOf(0.01)
      .max(999)
      .optional(),
    signatureDataUrl: z
      .string()
      .startsWith("data:image/png;base64,", "Unterschrift fehlt."),
  })
  .refine(
    (data) => (data.strauchschnittM3 ?? 0) > 0 || (data.gruenschnittM3 ?? 0) > 0,
    {
      message: "Bitte mindestens eine Menge (Strauch- oder Grünschnitt) angeben.",
      path: ["strauchschnittM3"],
    },
  );

export type DeliveryInput = z.infer<typeof deliverySchema>;
