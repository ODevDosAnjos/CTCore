import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Page, Query } from "@/components/query/QueryPage";

// Espelha PlanSummary do OpenAPI (docs/openapi.yaml).
export interface PlanSummary {
  plans: { active: number; inactive: number; studentsUsing: number; minValueCents: number | null; maxValueCents: number | null };
  benefits: { active: number; high: number };
}
type Result = { key: string; summary?: PlanSummary; status?: "forbidden" | "error" };

// RF-PLA-01: resumo da unidade escolhida (unitId nulo = todas do alcance); pede de novo ao trocar de unidade ou ao tentar de novo.
export function usePlanSummary(unitId: string | null) {
  const [tick, setTick] = useState(0);
  const key = `${unitId ?? ""}:${tick}`;
  const [done, setDone] = useState<Result>();
  useEffect(() => {
    let alive = true;
    api<PlanSummary>(`/plans/summary${unitId ? `?unitId=${encodeURIComponent(unitId)}` : ""}`).then(
      (summary) => alive && setDone({ key, summary }),
      (e) => alive && setDone({ key, status: e instanceof ApiError && e.status === 403 ? "forbidden" : "error" }),
    );
    return () => {
      alive = false;
    };
  }, [key, unitId]);
  const current = done?.key === key ? done : undefined;
  return { summary: current?.summary, status: !current ? "loading" : (current.status ?? "ready"), retry: () => setTick((n) => n + 1) } as const;
}

interface Choice {
  id: string;
  name: string;
}

// Espelha PlanRow do OpenAPI (docs/openapi.yaml). Frequência semanal nula é livre; só informa.
export interface PlanRow {
  id: string;
  unit: Choice;
  modality: Choice;
  name: string;
  valueCents: number;
  weeklyFrequency: 2 | 3 | null;
  validOtherUnits: boolean;
  studentsUsing: number;
  status: "ACTIVE" | "INACTIVE";
}

// Query da tela (RNF-27) -> GET /plans; erro sobe com o status (403 vira "sem permissão").
export async function fetchPlans(q: Query, unitId?: string): Promise<Page<PlanRow>> {
  const p = new URLSearchParams({ page: String(q.pagina), size: String(q.tamanho) });
  if (q.q) p.set("q", q.q);
  if (unitId) p.set("unitId", unitId);
  for (const [k, v] of Object.entries(q.filtros)) p.set(k, v);
  const data = await api<{ items: PlanRow[]; total: number }>(`/plans?${p}`);
  return { rows: data.items, total: data.total };
}

// Modalidades ativas para a pílula de filtro da tela de planos; falha deixa a lista vazia.
export function usePlanModalities() {
  const [modalities, setModalities] = useState<Choice[]>([]);
  useEffect(() => {
    let alive = true;
    api<(Choice & { active: boolean })[]>("/modalities").then(
      (m) => alive && setModalities(m.filter((x) => x.active)),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, []);
  return modalities;
}

// Opções dos filtros (modalidades ativas e unidades do alcance). Falha deixa a opção vazia; a lista segue.
export function usePlanFilterOptions() {
  const [options, setOptions] = useState<{ modalities: Choice[]; units: Choice[] }>({ modalities: [], units: [] });
  useEffect(() => {
    let alive = true;
    Promise.all([api<(Choice & { active: boolean })[]>("/modalities"), api<{ units: Choice[] }>("/units/reachable")]).then(
      ([m, u]) => alive && setOptions({ modalities: m.filter((x) => x.active), units: u.units }),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, []);
  return options;
}

// Espelha PlanDetail do OpenAPI (RN-PLA-06): o plano com a última alteração, quem desativou e o histórico de valor (mais novo primeiro).
export interface PlanDetail extends PlanRow {
  lastChange: { at: string; by: string | null } | null;
  deactivation: { at: string; by: string | null } | null;
  valueHistory: { startsOn: string; valueCents: number; changedBy: string | null }[];
}
export const fetchPlanDetail = (id: string) => api<PlanDetail>(`/plans/${id}`);

// Detalhe do plano; só carrega com id. 403 vira "sem permissão".
export function usePlanDetail(id: string | undefined) {
  const [tick, setTick] = useState(0);
  const key = `${id}:${tick}`;
  const [done, setDone] = useState<{ key: string; detail?: PlanDetail; forbidden?: boolean }>();
  useEffect(() => {
    if (!id) return;
    let alive = true;
    fetchPlanDetail(id).then(
      (detail) => alive && setDone({ key, detail }),
      (e) => alive && setDone({ key, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [id, key]);
  const current = id && done?.key === key ? done : undefined;
  return {
    status: !id ? "idle" : !current ? "loading" : current.detail ? "ready" : current.forbidden ? "forbidden" : "error",
    detail: current?.detail,
    retry: () => setTick((n) => n + 1),
  } as const;
}

// Espelham PlanInput, PlanOptions e PlanValueImpact do OpenAPI (RF-PLA-03).
export interface PlanInput {
  unitId?: string;
  modalityId?: string;
  name: string;
  valueCents: number;
  weeklyFrequency: 2 | 3 | null;
  validOtherUnits: boolean;
  unpaidCharges?: "KEEP" | "ADJUST";
  paidFutureDifference?: boolean;
}
export interface PlanOptions {
  crossUnitTraining: "plan" | "allowed" | "denied";
  units: { id: string; name: string; modalities: Choice[] }[];
}
export interface PlanValueImpact {
  studentsAffected: number;
  effectiveFrom: "NEXT_CHARGE";
  unpaidCharges: number;
  paidFutureCharges: number;
}

export const createPlan = (input: PlanInput) => api<PlanRow>("/plans", { method: "POST", body: input });
export const updatePlan = (id: string, input: PlanInput) => api<PlanRow>(`/plans/${id}`, { method: "PUT", body: input });
export const deactivatePlan = (id: string) => api<PlanRow>(`/plans/${id}/deactivate`, { method: "POST" });
export const activatePlan = (id: string) => api<PlanRow>(`/plans/${id}/activate`, { method: "POST" });
export const fetchValueImpact = (id: string, valueCents: number) => api<PlanValueImpact>(`/plans/${id}/value-impact?valueCents=${valueCents}`);

// Opções da janela; só carregam com a janela aberta. 403 vira "sem permissão".
export function usePlanOptions(enabled: boolean) {
  const [tick, setTick] = useState(0);
  const [done, setDone] = useState<{ tick: number; options?: PlanOptions; forbidden?: boolean }>();
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    api<PlanOptions>("/plans/options").then(
      (options) => alive && setDone({ tick, options }),
      (e) => alive && setDone({ tick, forbidden: e instanceof ApiError && e.status === 403 }),
    );
    return () => {
      alive = false;
    };
  }, [enabled, tick]);
  const current = done?.tick === tick ? done : undefined;
  return {
    status: !current ? "loading" : current.options ? "ready" : current.forbidden ? "forbidden" : "error",
    options: current?.options,
    retry: () => setTick((n) => n + 1),
  } as const;
}

// Impacto de mudar o valor; refeito a cada valor válido diferente do atual (RN-PLA-04).
export function usePlanImpact(planId: string | undefined, cents: number | null) {
  const [done, setDone] = useState<{ key: string; impact?: PlanValueImpact }>();
  const key = `${planId}:${cents}`;
  useEffect(() => {
    if (!planId || cents === null) return;
    let alive = true;
    fetchValueImpact(planId, cents).then(
      (impact) => alive && setDone({ key, impact }),
      () => alive && setDone({ key }),
    );
    return () => {
      alive = false;
    };
  }, [planId, cents, key]);
  const current = planId && cents !== null && done?.key === key ? done : undefined;
  return { status: !planId || cents === null ? "idle" : !current ? "loading" : current.impact ? "ready" : "error", impact: current?.impact } as const;
}
