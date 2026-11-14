import type { DailyReceipts } from "./types";

export type MethodRow = { key: string; count: number; totalCents: number; feeCents: number };
export type RegistrarRow = { id: string | null; name: string | null; count: number; totalCents: number };

// Ordem do canvas: portal primeiro, depois os lançados na gestão. Crédito e débito do portal viram um "Cartão pelo portal" (D2).
const ORDER = ["PIX_MP", "CARD", "BOLETO", "CASH", "CARD_MACHINE", "PIX_KEY", "TRANSFER"];
const keyOf = (method: string) => (method === "CREDIT_CARD" || method === "DEBIT_CARD" ? "CARD" : method);

/** Junta crédito e débito, ordena os meios e monta a linha Total (pagamentos, valor e taxa repassada). */
export function methodRows(byMethod: DailyReceipts["byMethod"]): { rows: MethodRow[]; total: MethodRow } {
  const map = new Map<string, MethodRow>();
  for (const m of byMethod) {
    const key = keyOf(m.method);
    const row = map.get(key) ?? { key, count: 0, totalCents: 0, feeCents: 0 };
    row.count += m.count;
    row.totalCents += m.totalCents;
    row.feeCents += m.feePassedCents;
    map.set(key, row);
  }
  const rank = (k: string) => (ORDER.includes(k) ? ORDER.indexOf(k) : ORDER.length);
  const rows = [...map.values()].sort((a, b) => rank(a.key) - rank(b.key));
  const total = rows.reduce((t, r) => ({ ...t, count: t.count + r.count, totalCents: t.totalCents + r.totalCents, feeCents: t.feeCents + r.feeCents }), { key: "TOTAL", count: 0, totalCents: 0, feeCents: 0 });
  return { rows, total };
}

/** Quem lançou, do maior valor ao menor; o pagamento sem lançador (portal) vem com `id` nulo. */
export function registrarRows(byRegistrar: DailyReceipts["byRegistrar"]): RegistrarRow[] {
  return byRegistrar
    .map((r) => ({ id: r.registeredBy?.id ?? null, name: r.registeredBy?.name ?? null, count: r.count, totalCents: r.totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

/** "Quinta, 8 de outubro de 2026": o dia já é o da unidade, então formata em UTC. */
export function longDate(iso: string): string {
  const s = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)).replace("-feira", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const shiftDay = (iso: string, days: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
