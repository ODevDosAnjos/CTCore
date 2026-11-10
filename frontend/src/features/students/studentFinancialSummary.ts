import type { ChargeRow } from "@/features/charges/types";
import { DEFAULT_TZ, formatDate, relativeDay } from "@/lib/format";

const OPEN = ["PENDING", "DUE_TODAY", "OVERDUE", "IN_REVIEW"];
const PAID = ["PAID", "PAID_LATE"];
export const isOpen = (c: ChargeRow) => OPEN.includes(c.status);
export const isPaid = (c: ChargeRow) => PAID.includes(c.status);
// Dá para registrar o pagamento no balcão enquanto a cobrança espera pagamento.
export const isPayable = (c: ChargeRow) => ["PENDING", "DUE_TODAY", "OVERDUE"].includes(c.status);

// Dias de atraso pelo dia da unidade (nunca o da JVM/navegador); 0 se não venceu.
export const daysLate = (c: ChargeRow, now: Date = new Date(), tz = DEFAULT_TZ) => Math.max(0, relativeDay(c.dueOn, now, tz) ?? 0);

const sum = (rows: ChargeRow[]) => rows.reduce((s, c) => s + c.amountCents, 0);

// Cartões do topo da aba Financeiro: Em aberto, Em atraso (maior atraso) e Pago no ano corrente.
export function summarize(items: ChargeRow[], now: Date = new Date(), tz = DEFAULT_TZ) {
  const open = items.filter(isOpen);
  const late = items.filter((c) => c.status === "OVERDUE");
  const year = formatDate(now, tz).slice(6);
  const paid = items.filter((c) => isPaid(c) && c.payment && formatDate(c.payment.paidAt, tz).slice(6) === year);
  return {
    open: { count: open.length, cents: sum(open) },
    overdue: { count: late.length, cents: sum(late), days: Math.max(0, ...late.map((c) => daysLate(c, now, tz))) },
    paid: { count: paid.length, cents: sum(paid), year },
  };
}

// Celular: grupos "Em aberto" e "Pagos"; o resto (canceladas, renegociadas, estornadas) vai em "other".
export const group = (items: ChargeRow[]) => ({ open: items.filter(isOpen), paid: items.filter(isPaid), other: items.filter((c) => !isOpen(c) && !isPaid(c)) });
