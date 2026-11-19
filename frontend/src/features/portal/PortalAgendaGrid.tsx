import { useTranslation } from "react-i18next";
import { brShort, weekDays, weekday } from "@/features/agenda/agendaDates";
import { PortalLessonItem } from "./PortalLessonItem";
import type { PortalScheduleData } from "./usePortalSchedule";

// RF-POR-04: 7 colunas iguais (segunda a domingo), as aulas do dia por horário de início; o dia sem aula é uma faixa listrada com o motivo.
export function PortalAgendaGrid({ data }: { data: PortalScheduleData }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-7 gap-3 rounded-xl border bg-card p-4">
      {weekDays(data.weekStart).map((d) => {
        const lessons = data.lessons.filter((l) => l.date === d).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        const off = data.noClassDays.filter((n) => n.date === d);
        const name = `${t(`agenda.weekdays.${weekday(d)}`)} ${brShort(d)}`;
        return (
          <section key={d} aria-label={name} className="flex min-w-0 flex-col gap-2">
            <h2 className={`border-b pb-2 font-sans text-sm font-semibold ${d === data.today ? "underline" : ""}`}>{t(`agenda.weekdays.${weekday(d)}`)} {Number(d.slice(8))}</h2>
            {off.map((n) => (
              <div
                key={n.unit.id + n.reason}
                className="flex min-h-72 flex-col items-center justify-center gap-1 break-words rounded-lg bg-[repeating-linear-gradient(135deg,var(--muted),var(--muted)_8px,var(--card)_8px,var(--card)_16px)] p-2 text-center"
              >
                <strong>{t("portalAgenda.noClass")}</strong>
                <span className="text-xs text-muted-foreground">{n.reason}</span>
              </div>
            ))}
            {lessons.map((l) => (
              <PortalLessonItem key={l.id} lesson={l} variant="grid" />
            ))}
            {lessons.length === 0 && off.length === 0 && <span className="text-muted-foreground">—</span>}
          </section>
        );
      })}
    </div>
  );
}
