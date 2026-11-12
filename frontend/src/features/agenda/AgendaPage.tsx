import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { useSession } from "@/features/auth/SessionProvider";
import { usePermissions } from "@/features/permissions/usePermissions";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Link, Outlet, useSearchParams } from "react-router";
import { SegmentedChoice } from "@/components/ui/segmented-choice";
import { addDays, mondayOf, rangeLabel, todayIso, weekDays } from "./agendaDates";
import { AgendaDayList } from "./AgendaDayList";
import { AgendaFilters, type FilterValues } from "./AgendaFilters";
import { AgendaWeekGrid } from "./AgendaWeekGrid";
import { AnnounceLessonDialog, type LessonNotice } from "@/features/announcements/AnnounceLessonDialog";
import { NewLessonDialog } from "./NewLessonDialog";
import { useAgenda } from "./useAgenda";
import { PageHeader } from "@/components/ui/page-header";

const narrow = () => window.innerWidth < 768;

// Até 767 px a mesma página mostra a lista do dia (R14).
function useNarrow() {
  const [value, setValue] = useState(narrow);
  useEffect(() => {
    const on = () => setValue(narrow());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return value;
}

function Content() {
  const { t } = useTranslation();
  const isNarrow = useNarrow();
  const [params, setParams] = useSearchParams();
  const today = todayIso();
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(params.get("semana") ?? "") ? params.get("semana")! : today;
  const setAnchor = (iso: string) => setParams(iso === today ? {} : { semana: iso }, { replace: true });
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<LessonNotice | null>(null);
  const { permissions } = usePermissions();
  const { state } = useSession();
  const teacherView = state.status === "ready" && state.session.links.find((l) => l.id === state.session.activeLinkId)?.role === "TEACHER";
  const [filters, setFilters] = useState<FilterValues>({ unitId: "", teacherId: "", modalityId: "" });
  const days = weekDays(anchor);
  const { status, data, last, retry } = useAgenda({ from: days[0], to: days[6], ...filters });
  const view = data ?? last;
  const canCreate = !!permissions && permissions.AGENDA_EDIT !== "NONE" && !!view?.unit;
  const canNoClassDays = !!permissions && permissions.NO_CLASS_DAYS !== "NONE";
  const thisMonday = mondayOf(today);
  const shown = mondayOf(anchor) === thisMonday ? "this" : mondayOf(anchor) === addDays(thisMonday, 7) ? "next" : "";
  const subtitle = view?.unit ? t("agenda.subtitle", { name: view.unit.name }) : t("agenda.subtitleNoUnit");

  if (status === "forbidden") {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title={t("agenda.title")} />
        <ForbiddenState />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("agenda.title")}
        subtitle={subtitle}
        actions={
          <>
            {canNoClassDays && (
              <Button asChild variant="outline" className="min-h-11">
                <Link to="/dias-sem-aula">
                  <Calendar aria-hidden="true" />
                  {t("agenda.noClassDays")}
                </Link>
              </Button>
            )}
            {canCreate && !isNarrow && (
              <Button className="min-h-11" onClick={() => setCreating(true)}>
                <Plus aria-hidden="true" />
                {t("agenda.new.open")}
              </Button>
            )}
          </>
        }
      />
      {!(isNarrow && teacherView) && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <Button variant="outline" className="h-8 min-h-0 px-3 text-[13px]" onClick={() => setAnchor(today)}>
            {t("agenda.today")}
          </Button>
          {isNarrow ? (
            <Button variant="outline" className="h-8 min-h-0 px-3 text-[13px]" onClick={() => setAnchor(mondayOf(anchor) === thisMonday ? anchor : today)}>
              {t("agenda.thisWeek")}
            </Button>
          ) : (
            <>
              <SegmentedChoice
                label={t("agenda.weekSwitch")}
                className="gap-0.5 rounded-lg border-0 bg-surface-soft p-[3px] [&_label]:min-h-8 [&_label]:rounded-md [&_label]:px-3 [&_label]:text-[13px]"
                options={[
                  { value: "this", label: t("agenda.thisWeek") },
                  { value: "next", label: t("agenda.nextWeek") },
                ]}
                value={shown}
                onChange={(v) => setAnchor(v === "this" ? today : addDays(thisMonday, 7))}
              />
              <Button variant="outline" className="size-8 min-h-0 p-0" aria-label={t("agenda.prevWeek")} title={t("agenda.prevWeek")} onClick={() => setAnchor(addDays(anchor, -7))}>
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Button>
              <Button variant="outline" className="size-8 min-h-0 p-0" aria-label={t("agenda.nextWeek")} title={t("agenda.nextWeek")} onClick={() => setAnchor(addDays(anchor, 7))}>
                <ChevronRight aria-hidden="true" className="size-4" />
              </Button>
              <span aria-live="polite" className="font-semibold">
                {rangeLabel(days[0], days[6])}
              </span>
            </>
          )}
          <span className="grow" />
          <AgendaFilters noLegend={isNarrow} options={view} values={filters} onChange={(v) => setFilters((f) => ({ ...f, ...v }))} />
        </div>
      )}
      {creating && canCreate && (
        <NewLessonDialog unit={view!.unit!} modalities={view!.modalities} teachers={view!.teachers} onClose={() => setCreating(false)} onSaved={(created, notify) => {
            retry();
            // R10: "Avisar os alunos" abre o comunicado "Aviso geral" para a turma de visibilidade ou, sem ela, para a unidade.
            if (notify)
              setNotice({
                target: created.visibilityClass ? { kind: "CLASS", classId: created.visibilityClass.id, name: created.visibilityClass.name, hasGroup: !!created.groupLink } : { kind: "UNIT", unitId: created.unit.id, name: created.unit.name },
                date: created.date,
                time: created.startsAt,
                cancelled: false,
                type: "GENERAL",
              });
          }}
        />
      )}
      <AnnounceLessonDialog notice={notice} onClose={() => setNotice(null)} />
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "ready" && data && isNarrow && <AgendaDayList data={data} day={anchor} onStep={(n) => setAnchor(addDays(anchor, n))} teacherView={teacherView} onNew={canCreate ? () => setCreating(true) : undefined} />}
      {status === "ready" && data && !isNarrow && data.lessons.length === 0 && data.noClassDays.length === 0 && (
        <EmptyState title={t("agenda.emptyTitle")} text={t("agenda.emptyText")} />
      )}
      {status === "ready" && data && !isNarrow && (data.lessons.length > 0 || data.noClassDays.length > 0) && <AgendaWeekGrid data={data} anchor={anchor} today={today} />}
      <Outlet />
    </div>
  );
}

// RF-AGE-01: a barreira de dados é o servidor (403 vira "sem permissão" na própria tela).
export function AgendaPage() {
  return (
    <ManagementLayout activeId="agenda">
      <Content />
    </ManagementLayout>
  );
}
