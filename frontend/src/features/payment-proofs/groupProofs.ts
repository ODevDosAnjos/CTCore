import type { PaymentProof } from "./types";

// RN-COB-14: um comprovante enviado de uma vez para várias cobranças é gravado como um por cobrança, todos com o mesmo aluno e o mesmo instante de envio.
// A tela os mostra como um item só (D7); cada cobrança continua sendo decidida uma a uma.
export interface ProofGroup {
  key: string;
  studentId: string;
  studentName: string;
  studentPhotoUrl: string | null;
  unit: string;
  sentAt: string;
  items: PaymentProof[];
  totalCents: number;
  /** "Jiu-Jitsu e Muay Thai · out/2026" (várias do mesmo mês) ou a referência de cada uma, juntas por " e ". */
  label: string;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "Muay Thai · 10/2026" -> { name: "Muay Thai", month: "out/2026" }; referência sem mês (avulsa) fica só com o nome.
export function splitReference(reference: string): { name: string; month: string } {
  const m = /^(?:(.*?) · )?(\d{2})\/(\d{4})$/.exec(reference);
  if (!m) return { name: reference, month: "" };
  return { name: m[1] ?? "", month: `${MONTHS[Number(m[2]) - 1] ?? m[2]}/${m[3]}` };
}

export const referenceLabel = (reference: string) => {
  const { name, month } = splitReference(reference);
  return [name, month].filter(Boolean).join(" · ");
};

function labelOf(items: PaymentProof[]) {
  const parts = items.map((p) => splitReference(p.reference));
  const months = new Set(parts.map((p) => p.month));
  if (months.size === 1) return [parts.map((p) => p.name).filter(Boolean).join(" e "), parts[0].month].filter(Boolean).join(" · ");
  return items.map((p) => referenceLabel(p.reference)).join(" e ");
}

// Mantém a ordem de envio da lista (a primeira ocorrência de cada grupo define a posição).
export function groupProofs(list: PaymentProof[]): ProofGroup[] {
  const groups = new Map<string, PaymentProof[]>();
  for (const p of list) {
    const key = `${p.studentId}|${p.sentAt}`;
    const group = groups.get(key);
    if (group) group.push(p);
    else groups.set(key, [p]);
  }
  return [...groups].map(([key, items]) => ({
    key,
    studentId: items[0].studentId,
    studentName: items[0].studentName,
    studentPhotoUrl: items[0].studentPhotoUrl,
    unit: items[0].unit,
    sentAt: items[0].sentAt,
    items,
    totalCents: items.reduce((sum, p) => sum + p.amountCents, 0),
    label: labelOf(items),
  }));
}
