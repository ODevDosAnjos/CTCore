import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Badge } from "@/components/ui/badge";
import { hourLabel } from "./agendaDates";
import type { AgendaLesson } from "./useAgenda";

// D2: a tabela de modalidades não tem cor; ela vem de uma paleta fixa, escolhida pelo id. A cor nunca é a única indicação: a modalidade também vai em texto.
const HUES = [210, 30, 140, 280, 0, 175, 50, 320];
export const modalityHue = (id: string) => HUES[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];

// RF-AGE-03 (D5): o código é traduzido; "Outro" e a aula cancelada por dia sem aula mostram o texto que o servidor guardou.
export function cancelReasonText(lesson: Pick<AgendaLesson, "cancelReason" | "cancelReasonCode">, t: (key: string) => string) {
  return lesson.cancelReasonCode && lesson.cancelReasonCode !== "OTHER" ? t(`agenda.cancelReasons.${lesson.cancelReasonCode}`) : lesson.cancelReason;
}

// RF-AGE-04: a aula avulsa mostra o título no lugar do nome da turma.
export const lessonName = (lesson: Pick<AgendaLesson, "class" | "title">) => lesson.class?.name ?? lesson.title ?? "";

// R6/R7: cartão da lista do dia (celular). Hora grande à esquerda; o Professor vê a unidade e um chevron no lugar do professor.
export function DayLessonCard({ lesson, teacherView }: { lesson: AgendaLesson; teacherView?: boolean }) {
  const { t } = useTranslation();
  const { search } = useLocation();
  const cancelled = lesson.status === "CANCELLED";
  const color = modalityColor(lesson.modality.id);
  const meta = teacherView
    ? [lesson.unit.name, t("agenda.studentsCount", { count: lesson.activeStudents }), lesson.trialClasses > 0 ? t("agenda.experimental", { count: lesson.trialClasses }) : ""]
    : [lesson.teacher.name, t("agenda.studentsCount", { count: lesson.activeStudents })];
  return (
    <li className={`min-w-0 rounded-lg border border-l-4 text-sm break-words ${cancelled ? "bg-surface-soft" : "bg-card"}`} style={{ borderLeftColor: cancelled ? "var(--divider)" : color }}>
      <Link to={{ pathname: `/agenda/aulas/${lesson.id}`, search }} className="flex min-h-14 min-w-0 items-center gap-3 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex w-12 shrink-0 flex-col">
          <span className="text-lg font-semibold leading-tight">{hourLabel(lesson.startsAt)}</span>
          <span className="text-[11px] text-muted-foreground">{t("agenda.until", { time: hourLabel(lesson.endsAt) })}</span>
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className={cancelled ? "font-semibold line-through" : "font-semibold"}>{lessonName(lesson)}</span>
          <span className="text-muted-foreground">{meta.filter(Boolean).join(" · ")}</span>
          <span className="flex flex-wrap gap-1 empty:hidden">
            {lesson.substitute && <Badge tone="info">{t("agenda.substitute")}</Badge>}
            {!lesson.class && <Badge tone="neutral">{t("agenda.adhoc")}</Badge>}
            {cancelled && <Badge tone="danger">{t("agenda.cancelled")}</Badge>}
            {!teacherView && lesson.trialClasses > 0 && <Badge tone="acc">{t("agenda.experimental", { count: lesson.trialClasses })}</Badge>}
          </span>
        </span>
        {teacherView && !lesson.substitute && <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
      </Link>
    </li>
  );
}

export const modalityColor = (id: string) => `hsl(${modalityHue(id)} 60% 45%)`;

// Cartão da grade semanal (RF-AGE-01): faixa lateral e fundo suave na cor da modalidade; a posição vem da grade.
export function GridLessonCard({ lesson, top, height }: { lesson: AgendaLesson; top: number; height: number }) {
  const { t } = useTranslation();
  const { search } = useLocation();
  const cancelled = lesson.status === "CANCELLED";
  const color = modalityColor(lesson.modality.id);
  return (
    <li className="absolute inset-x-0.5 min-w-0 overflow-hidden rounded-md border-l-4 text-xs" style={{ top, height, borderLeftColor: cancelled ? "var(--divider)" : color, backgroundColor: cancelled ? "var(--surface-soft)" : `hsl(${modalityHue(lesson.modality.id)} 60% 45% / 0.12)` }}>
      <Link to={{ pathname: `/agenda/aulas/${lesson.id}`, search }} className="flex h-full min-w-0 flex-col gap-px p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="text-[11px] text-muted-foreground">
          {hourLabel(lesson.startsAt)}–{hourLabel(lesson.endsAt)}
        </span>
        <span className={`truncate font-semibold ${cancelled ? "line-through" : ""}`}>{lessonName(lesson)}</span>
        <span className="truncate text-muted-foreground">{lesson.teacher.name}</span>
        <span className="mt-0.5 flex flex-wrap gap-1">
          {lesson.substitute && <Badge tone="info">{t("agenda.substitute")}</Badge>}
          {!lesson.class && <Badge tone="neutral">{t("agenda.adhoc")}</Badge>}
          {cancelled && <Badge tone="danger">{t("agenda.cancelled")}</Badge>}
          {lesson.trialClasses > 0 && <Badge tone="acc">{t("agenda.experimental", { count: lesson.trialClasses })}</Badge>}
        </span>
      </Link>
    </li>
  );
}
