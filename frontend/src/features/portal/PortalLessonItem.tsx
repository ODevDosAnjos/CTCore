import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { hourLabel } from "@/features/agenda/agendaDates";
import { formatDate } from "@/lib/format";
import type { ScheduleLesson } from "./usePortalSchedule";

// RN-AGE-04, RN-AGE-05: a aula com seus avisos visuais (sempre com texto). O motivo e o resumo são texto, nunca HTML.
// "grid": cartão da coluna da grade; "list": cartão da lista do dia no celular.
export function PortalLessonItem({ lesson: l, variant }: { lesson: ScheduleLesson; variant: "grid" | "list" }) {
  const { t } = useTranslation();
  const list = variant === "list";
  const cancelled = l.status === "CANCELLED";
  const reason =
    l.cancelReasonCode === "OTHER" || !l.cancelReasonCode
      ? (l.cancelReason ?? (l.cancelReasonCode ? t("agenda.cancelReasons.OTHER") : null))
      : t(`agenda.cancelReasons.${l.cancelReasonCode}`);
  const parts = [
    l.originalDate || l.originalStartsAt ? t("portalAgenda.wasOn", { date: formatDate(l.originalDate ?? l.date), time: l.originalStartsAt ?? l.startsAt }) : null,
    l.substitute ? t("portalAgenda.substituteName", { name: l.teacherName }) : null,
  ].filter(Boolean);
  const summary = parts.length ? parts.join(" · ") : t("portalAgenda.changedGeneric");
  const type =
    l.kind === "MAIN"
      ? `${l.teacherName} · ${t("portalAgenda.typeMain")}`
      : l.kind === "OTHER"
        ? `${t("portalAgenda.typeOther")} · ${l.teacherName}`
        : t("portalAgenda.typeAdhoc");
  const pill = cancelled ? (
    <Badge tone="neutral">{t("portalAgenda.cancelled")}</Badge>
  ) : l.changed ? (
    <Badge tone="warn">{t("portalAgenda.changed")}</Badge>
  ) : list && l.kind === "MAIN" ? (
    <Badge tone="info">{t("portalAgenda.mainPill")}</Badge>
  ) : null;
  const notice = l.noticeId && (
    <Link to={`/portal/avisos?aviso=${l.noticeId}`} className="inline-flex min-h-6 items-center text-sm underline" aria-label={t("portalAgenda.viewNoticeOf", { title: l.title })}>
      {t("portalAgenda.viewNotice")}
    </Link>
  );
  const bar = l.kind === "MAIN" && !cancelled ? "border-l-info-foreground" : "border-l-muted-foreground";
  return (
    <div className={`flex flex-col gap-1 rounded-lg border-l-4 p-3 text-sm ${bar} ${list ? "border bg-card" : cancelled || l.kind !== "MAIN" ? "bg-neutral text-neutral-foreground" : "bg-info text-info-foreground"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{list ? `${hourLabel(l.startsAt)}–${hourLabel(l.endsAt)}` : hourLabel(l.startsAt)}</span>
        {list && pill}
      </div>
      <p className={`break-words font-semibold ${cancelled ? "line-through" : ""}`}>{l.title}</p>
      <p className="break-words opacity-80">{list ? `${type} · ${l.unit.name}` : type}</p>
      {cancelled && reason && <p className="break-words">{t("portalAgenda.reason", { reason })}</p>}
      {l.changed && !cancelled && <p className="break-words">{summary}</p>}
      {l.past && <p className="text-xs opacity-80">{t("portalAgenda.past")}</p>}
      {(!list && pill) || notice ? (
        <div className="flex flex-wrap items-center gap-2">
          {!list && pill}
          {notice}
        </div>
      ) : null}
    </div>
  );
}
