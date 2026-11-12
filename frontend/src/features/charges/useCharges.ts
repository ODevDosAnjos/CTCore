import { api } from "@/lib/api";
import type { Page, Query } from "@/components/query/QueryPage";
import type { ChargeList, ChargeRow } from "./types";
import { periodRange } from "./period";

// Ordem da tela ("campo" ou "-campo") -> sort da rota; sem escolha vale o padrão do servidor (vencimento, mais recente primeiro).
const sortOf = (ordem: string) => (ordem ? `${ordem.replace(/^-/, "")},${ordem.startsWith("-") ? "desc" : "asc"}` : "dueOn,desc");

// Query da tela (RNF-27) -> GET /charges. O filtro `period` (AAAA-MM) vira `from` e `to` do mês; a unidade vem da barra.
// `counts` leva as abas (inclui `all`) e os totais do rodapé (totalCount, totalCents, paidCents, openCents); erro sobe com o status (403 vira "sem permissão").
export async function fetchCharges(q: Query, unitId?: string): Promise<Page<ChargeRow>> {
  const p = new URLSearchParams({ page: String(q.pagina), size: String(q.tamanho), sort: sortOf(q.ordem) });
  if (q.q) p.set("q", q.q);
  for (const [k, v] of Object.entries(q.filtros)) {
    if (k !== "period") p.set(k, v);
  }
  const range = q.filtros.period ? periodRange(q.filtros.period) : null;
  if (range) {
    p.set("from", range.from);
    p.set("to", range.to);
  }
  if (unitId) p.set("unitId", unitId);
  const data = await api<ChargeList>(`/charges?${p}`);
  const { totals } = data;
  return { rows: data.items, total: data.total, counts: { ...data.counts, totalCount: totals.count, totalCents: totals.amountCents, paidCents: totals.paidCents, openCents: totals.openCents } };
}
