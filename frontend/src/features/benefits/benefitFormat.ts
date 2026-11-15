import { formatMoney } from "@/components/fields/masks";
import type { BenefitRow } from "./useBenefits";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-11" -> "nov/2026". */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-");
  return `${MONTHS[Number(m) - 1]}/${year}`;
}

/** "2026-11" -> "out/2026" (o mês da última cobrança já gerada). */
export function previousMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return monthLabel(m === 1 ? `${year - 1}-12` : `${year}-${String(m - 1).padStart(2, "0")}`);
}

/** "2026-12-31" -> "12/2026". */
export const untilMonth = (date: string) => `${date.slice(5, 7)}/${date.slice(0, 4)}`;

/** Bolsa em percentual ("50%") ou desconto em reais ("R$ 30,00"). */
export const valueText = (b: Pick<BenefitRow, "type" | "value">) => (b.type === "PERCENT" ? `${b.value}%` : formatMoney(b.value));
