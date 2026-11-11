import { useTranslation } from "react-i18next";
import { relativeDay } from "@/lib/format";
import type { PortalRequest } from "./types";

// Uma linha com o que foi pedido, igual na lista da gestão e no portal.
export function requestSummary(t: (key: string, o?: Record<string, unknown>) => string, r: PortalRequest): string {
  return t(`portalRequests.summary.${r.kind}`, {
    modality: r.modality ?? "",
    targetClass: r.targetClass ?? "",
    targetPlan: r.targetPlan ?? "",
    targetUnit: r.targetUnit ?? "",
    reason: r.reason ? t(`students.record.enrollment.end.reasons.${r.reason}`) : "",
  });
}

export function RequestSummary({ request }: { request: PortalRequest }) {
  const { t } = useTranslation();
  return <>{requestSummary(t, request)}</>;
}

type T = (key: string, o?: Record<string, unknown>) => string;

// Detalhe da lista da gestão (canvas): o que foi pedido, com a turma ou o plano atual quando há (D3).
export function requestDetail(t: T, r: PortalRequest): string {
  const empty = t("format.empty");
  return t(`portalRequests.detail.${r.kind}`, {
    modality: r.modality ?? "",
    from: (r.kind === "PLAN_CHANGE" ? r.currentPlan : r.currentClass) ?? empty,
    to: (r.kind === "PLAN_CHANGE" ? r.targetPlan : r.targetClass) ?? empty,
    targetUnit: r.targetUnit ?? "",
    reason: r.reason ? t(`students.record.enrollment.end.reasons.${r.reason}`).toLocaleLowerCase("pt-BR") : "",
    date: r.expiresAt.slice(8, 10) + "/" + r.expiresAt.slice(5, 7),
  });
}

// Prazo (RN-MAT-16, RN-MAT-18), pela data do dia na unidade: "expira em N dias" (30 dias) ou, no encerramento, "faltam N dias" até o 7º dia da gestão.
export function requestDeadline(t: T, r: PortalRequest, now: Date = new Date()): string {
  const left = -(relativeDay(r.expiresAt, now) ?? 0) - (r.kind === "CLOSURE" ? 1 : 0);
  if (left <= 0) return t("portalRequests.deadline.today");
  return t(`portalRequests.deadline.${r.kind === "CLOSURE" ? "left" : "expires"}`, { count: left });
}
