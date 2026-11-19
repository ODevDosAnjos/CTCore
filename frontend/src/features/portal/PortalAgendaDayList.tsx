import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { brShort, weekdayLong } from "@/features/agenda/agendaDates";
import { PortalLessonItem } from "./PortalLessonItem";
import type { PortalScheduleData } from "./usePortalSchedule";

// RF-POR-04: no celular, "< SEXTA, 16/10 >" e a lista do dia; as setas passam de uma semana para outra.
export function PortalAgendaDayList({ data, day, onStep }: { data: PortalScheduleData; day: string; onStep: (day: string, delta: number) => void }) {
  const { t } = useTranslation();
  const lessons = data.lessons.filter((l) => l.date === day).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const off = data.noClassDays.filter((n) => n.date === day);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button variant="outline" className="size-9 min-h-0 p-0" aria-label={t("portalAgenda.prevDay")} onClick={() => onStep(day, -1)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Button>
        <h2 aria-live="polite" className="text-lg font-semibold uppercase">
          {weekdayLong(day)}, {brShort(day)}
        </h2>
        <Button variant="outline" className="size-9 min-h-0 p-0" aria-label={t("portalAgenda.nextDay")} onClick={() => onStep(day, 1)}>
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
      {off.map((n) => (
        <p key={n.unit.id + n.reason} className="break-words rounded-lg bg-muted p-3">
          <strong>{t("portalAgenda.noClass")}</strong> · {n.reason}
        </p>
      ))}
      {lessons.length === 0 && off.length === 0 && <p className="text-muted-foreground">{t("portalAgenda.noLessonsDay")}</p>}
      {lessons.map((l) => (
        <PortalLessonItem key={l.id} lesson={l} variant="list" />
      ))}
    </div>
  );
}
