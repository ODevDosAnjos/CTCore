import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PillFilter } from "@/components/ui/pill-filter";
import { SegmentedChoice } from "@/components/ui/segmented-choice";
import { Select } from "@/components/ui/field";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { addDays, rangeLabel, weekDays } from "@/features/agenda/agendaDates";
import { PortalAgendaDayList } from "./PortalAgendaDayList";
import { PortalAgendaGrid } from "./PortalAgendaGrid";
import { PortalHeading } from "./PortalHeading";
import { usePortalSchedule, type PortalScheduleData, type ScheduleScope } from "./usePortalSchedule";

const WIDE = "(min-width: 768px)";

// D7: grade a partir de md e lista do dia abaixo; uma só visão no DOM, para o axe e o leitor de tela não lerem o conteúdo duas vezes.
function useWide() {
  const [wide, setWide] = useState(() => window.matchMedia?.(WIDE).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(WIDE);
    if (!m) return;
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

// RF-POR-04: agenda da semana do aluno em `?aluno=`, `?semana=` e `?escopo=` (padrão: primeiro cartão, semana de hoje, todos os horários). Só consulta.
export function PortalAgendaPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const student = params.get("aluno");
  const week = params.get("semana");
  const scope: ScheduleScope = params.get("escopo") === "MAIN" ? "MAIN" : "ALL";
  const wide = useWide();
  const [picked, setPicked] = useState<string>();
  const [modality, setModality] = useState("");
  const { status, data, reload } = usePortalSchedule(student, week, scope);
  // Os controles ficam na tela enquanto a semana nova carrega.
  const [last, setLast] = useState<PortalScheduleData>();
  if (data && data !== last) setLast(data);
  const shown = data ?? last;

  const change = (patch: Record<string, string | null>) => {
    if ("aluno" in patch) setModality("");
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const modalities = [...new Map((shown?.lessons ?? []).map((l) => [l.modality.id, l.modality])).values()];
  const visible = (d: PortalScheduleData): PortalScheduleData => (modality ? { ...d, lessons: d.lessons.filter((l) => l.modality.id === modality) } : d);
  const step = (d: PortalScheduleData, day: string, delta: number) => {
    const next = addDays(day, delta);
    if (!weekDays(d.weekStart).includes(next)) change({ semana: addDays(d.weekStart, delta * 7) });
    setPicked(next);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <PortalHeading label={t("portalAgenda.label")} title={t("portalAgenda.title")} />
        {shown && (
          <SegmentedChoice
            label={t("portalAgenda.scopeLabel")}
            className="gap-0.5 rounded-lg border-0 bg-surface-soft p-[3px] max-sm:w-full max-sm:[&_label]:flex-1 [&_label]:min-h-8 [&_label]:rounded-md [&_label]:px-3 [&_label]:text-[13px]"
            options={[
              { value: "MAIN", label: t("portalAgenda.scopeMain") },
              { value: "ALL", label: t("portalAgenda.scopeAll") },
            ]}
            value={scope}
            onChange={(v) => change({ escopo: v === "MAIN" ? "MAIN" : null })}
          />
        )}
      </div>
      {shown && (wide || shown.students.length > 1) && (
        <nav aria-label={t("portalAgenda.weekNav")} className="mb-4 flex flex-wrap items-center gap-2">
          {wide && (
            <>
              <Button variant="outline" className="size-9 min-h-0 p-0" aria-label={t("portalAgenda.prevWeek")} onClick={() => change({ semana: addDays(shown.weekStart, -7) })}>
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <span className="font-semibold" aria-live="polite">
                {rangeLabel(shown.weekStart, shown.weekEnd, false)}
              </span>
              <Button variant="outline" className="size-9 min-h-0 p-0" aria-label={t("portalAgenda.nextWeek")} onClick={() => change({ semana: addDays(shown.weekStart, 7) })}>
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
            </>
          )}
          <span className="grow" />
          {shown.students.length > 1 && (
            <label className="flex items-center gap-2 text-sm font-medium">
              {t("portalAgenda.student")}
              <Select value={student ?? shown.studentId} onChange={(e) => change({ aluno: e.target.value })}>
                {shown.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.self ? t("portalAgenda.you") : s.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          {wide && <PillFilter label={t("portalAgenda.modality")} value={modality} onChange={setModality} allLabel={t("portalAgenda.allModalities")} options={modalities} />}
        </nav>
      )}
      {status === "loading" || status === "idle" ? (
        <LoadingState />
      ) : status === "forbidden" ? (
        <ForbiddenState />
      ) : status === "ready" && data ? (
        data.lessons.length === 0 && data.noClassDays.length === 0 ? (
          <EmptyState title={t("portalAgenda.emptyTitle")} text={t("portalAgenda.emptyText")} />
        ) : wide ? (
          <PortalAgendaGrid data={visible(data)} />
        ) : (
          <PortalAgendaDayList data={visible(data)} day={dayOf(data, picked)} onStep={(day, delta) => step(data, day, delta)} />
        )
      ) : (
        <ErrorState onRetry={reload} />
      )}
    </>
  );
}

// Começa em hoje, ou na segunda se a semana não tem hoje.
function dayOf(data: PortalScheduleData, picked?: string) {
  const days = weekDays(data.weekStart);
  return picked && days.includes(picked) ? picked : days.includes(data.today) ? data.today : data.weekStart;
}
