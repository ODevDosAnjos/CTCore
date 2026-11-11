import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { brShort, weekday } from "./agendaDates";
import { noClassOn } from "./AgendaWeekGrid";
import { DayLessonCard } from "./LessonCard";
import type { AgendaData } from "./useAgenda";

// R6/R7: a lista do dia, no celular, com o cabeçalho do dia e as setas; o Professor usa a mesma lista (cartões com unidade e chevron).
export function AgendaDayList({ data, day, onStep, teacherView, onNew }: { data: AgendaData; day: string; onStep: (n: number) => void; teacherView?: boolean; onNew?: () => void }) {
  const { t } = useTranslation();
  const off = noClassOn(data, day);
  const lessons = data.lessons.filter((l) => l.date === day);
  const name = (iso: string) => t(`agenda.weekdaysLong.${weekday(iso)}`).split("-")[0];
  const title = `${name(day)}, ${brShort(day)}`;
  const arrow = "size-8 min-h-0 p-0";
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex items-center gap-2">
        <Button variant="outline" className={arrow} aria-label={t("agenda.prevDay")} title={t("agenda.prevDay")} onClick={() => onStep(-1)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <div className="min-w-0 grow text-center" aria-live="polite">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{t("agenda.dayCount", { count: lessons.length, unit: data.unit?.name ?? "" })}</div>
        </div>
        <Button variant="outline" className={arrow} aria-label={t("agenda.nextDay")} title={t("agenda.nextDay")} onClick={() => onStep(1)}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {off && <p className="rounded-md bg-muted p-2 text-sm">{t("agenda.dayOff", { day: name(day), date: brShort(day), reason: off.reason })}</p>}
      {lessons.length === 0 ? (
        !off && <EmptyState title={t("agenda.emptyTitle")} text={t("agenda.emptyText")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {lessons.map((l) => (
            <DayLessonCard key={l.id} lesson={l} teacherView={teacherView} />
          ))}
        </ul>
      )}
      {onNew && (
        <Button className="min-h-11" onClick={onNew}>
          <Plus aria-hidden="true" />
          {t("agenda.new.open")}
        </Button>
      )}
    </section>
  );
}
