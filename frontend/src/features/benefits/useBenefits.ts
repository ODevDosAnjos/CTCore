import { api } from "@/lib/api";
import type { Page, Query } from "@/components/query/QueryPage";

export { usePlanModalities as useBenefitModalities } from "@/features/plans/usePlans";

interface Choice {
  id: string;
  name: string;
}

// Espelha BenefitRow do OpenAPI (docs/openapi.yaml). `value`: percentual inteiro em PERCENT, centavos em AMOUNT.
export interface BenefitRow {
  id: string;
  student: Choice;
  unit: Choice;
  modality: Choice;
  type: "PERCENT" | "AMOUNT";
  value: number;
  reason: string;
  decidedBy: string;
  grantedBy: string | null;
  validUntil: string | null;
  status: "ACTIVE" | "EXPIRED" | "ENDED";
  high: boolean;
  monthlyValueCents: number;
  planValueCents: number;
  /** Mês (AAAA-MM) da primeira cobrança ainda não gerada: a partir dele o encerramento vale. */
  nextChargeMonth: string;
}

/** Abas da tela: ativos, ativos altos e encerrados (encerrado ou vencido). */
export type BenefitView = "ACTIVE" | "HIGH" | "CLOSED";
export const BENEFIT_VIEWS: BenefitView[] = ["ACTIVE", "HIGH", "CLOSED"];

// Query da tela (RNF-27) -> GET /benefits; a aba (`view`) vira status (e high) e a unidade vem da barra. `counts` leva as abas; erro sobe com o status (403 vira "sem permissão").
export async function fetchBenefits(q: Query, unitId?: string): Promise<Page<BenefitRow>> {
  const p = new URLSearchParams({ page: String(q.pagina), size: String(q.tamanho) });
  if (q.q) p.set("q", q.q);
  for (const [k, v] of Object.entries(q.filtros)) {
    if (k !== "view") p.set(k, v);
  }
  const view = q.filtros.view ?? "ACTIVE";
  p.set("status", view === "CLOSED" ? "CLOSED" : "ACTIVE");
  if (view === "HIGH") p.set("high", "true");
  if (unitId) p.set("unitId", unitId);
  const data = await api<{ items: BenefitRow[]; total: number; counts: { active: number; high: number; closed: number } }>(`/benefits?${p}`);
  return { rows: data.items, total: data.total, counts: data.counts };
}
