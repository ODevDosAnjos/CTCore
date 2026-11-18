import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Page, Query } from "@/components/query/QueryPage";
import type { AnnouncementCreated, AnnouncementDailyLimit, AnnouncementDraft, AnnouncementImage, AnnouncementItem, AnnouncementList, AnnouncementPreview, AnnouncementTargets, AnnouncementTemplates } from "./types";

// Ordem da tela ("campo" ou "-campo") -> sort da rota; sem escolha vale o padrão do servidor (mais recente primeiro).
const sortOf = (ordem: string) => (ordem ? `${ordem.replace(/^-/, "")},${ordem.startsWith("-") ? "desc" : "asc"}` : "date,desc");

// Sem período escolhido vale "Últimos 30 dias" (canvas): o início é 30 dias antes de hoje; o fim fica aberto, para o agendado futuro aparecer.
const last30 = () => new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);

// Query da tela (RNF-27) -> GET /announcements; erro sobe com o status (403 vira "sem permissão").
export async function fetchAnnouncements(q: Query): Promise<Page<AnnouncementItem>> {
  const p = new URLSearchParams({ page: String(q.pagina), size: String(q.tamanho), sort: sortOf(q.ordem) });
  for (const k of ["from", "to", "classId", "type"]) if (q.filtros[k]) p.set(k, q.filtros[k]);
  if (!q.filtros.from && !q.filtros.to) p.set("from", last30());
  const data = await api<AnnouncementList>(`/announcements?${p}`);
  return { rows: data.items, total: data.total };
}

// RN-COM-06: só o agendado se cancela; o enviado volta 409.
export const cancelAnnouncement = (id: string) => api<void>(`/announcements/${id}`, { method: "DELETE" });

// RF-COM-02: destinos que o perfil pode escolher, prévia (não grava), criação e imagem (enviada antes, o comunicado guarda só o nome).
export const fetchTargets = () => api<AnnouncementTargets>("/announcements/targets");
export const fetchTemplates = () => api<{ templates: AnnouncementTemplates }>("/announcements/templates").then((r) => r.templates);
export const previewAnnouncement = (draft: AnnouncementDraft) => api<AnnouncementPreview>("/announcements/preview", { method: "POST", body: draft });
export const createAnnouncement = (draft: AnnouncementDraft) => api<AnnouncementCreated>("/announcements", { method: "POST", body: draft });
export const uploadAnnouncementImage = (file: File) => {
  const form = new FormData();
  form.append("file", file);
  return api<AnnouncementImage>("/announcements/image", { method: "POST", body: form });
};

// RN-COM-07: quantos comunicados a unidade (e, só para o Coordenador, a organização) já usou hoje do limite diário.
export const fetchDailyLimit = (unitId?: string) => api<AnnouncementDailyLimit>(`/announcements/daily-limit${unitId ? `?unitId=${unitId}` : ""}`);

// Uso do limite do dia da unidade; sem unidade (todas) não consulta. `version` refaz a consulta (depois de cancelar). Erro: sem contagem, a tela segue sem faixa.
export function useDailyLimit(unitId: string | undefined, version: number) {
  const [done, setDone] = useState<{ key: string; data: AnnouncementDailyLimit | null }>();
  const key = `${unitId}:${version}`;
  useEffect(() => {
    if (!unitId) return;
    let alive = true;
    fetchDailyLimit(unitId).then(
      (data) => alive && setDone({ key, data }),
      () => alive && setDone({ key, data: null }),
    );
    return () => {
      alive = false;
    };
  }, [unitId, key]);
  return unitId && done?.data?.unit.id === unitId ? done.data : null;
}
