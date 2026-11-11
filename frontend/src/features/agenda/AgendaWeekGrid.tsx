import { useTranslation } from "react-i18next";
import { hourLabel, minutes, weekDays } from "./agendaDates";
import { GridLessonCard } from "./LessonCard";
import type { AgendaData } from "./useAgenda";

export const noClassOn = (data: AgendaData, day: string) => data.noClassDays.find((n) => n.startsOn <= day && day <= n.endsOn);

const HOUR = 52; // px por hora (canvas)

// RF-AGE-01: segunda a domingo em colunas, escala de horas de 7h a 21h (estende-se se houver aula fora da faixa) e cartão posicionado pelo início, com altura pela duração.
export function AgendaWeekGrid({ data, anchor, today }: { data: AgendaData; anchor: string; today: string }) {
  const { t } = useTranslation();
  const days = weekDays(anchor);
  const first = Math.min(7, ...data.lessons.map((l) => Math.floor(minutes(l.startsAt) / 60)));
  const last = Math.max(21, ...data.lessons.map((l) => Math.ceil(minutes(l.endsAt) / 60) - 1));
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const height = hours.length * HOUR;
  const cols = "grid grid-cols-[56px_repeat(7,minmax(0,1fr))]";
  return (
    <div className="overflow-x-auto rounded-xl border bg-card">
      <div className="min-w-[56rem]">
        <div className={`${cols} border-b bg-surface-soft`}>
          <div />
          {days.map((d, i) => (
            <div key={d} className={`border-l border-divider px-2 py-2.5 text-center ${d === today ? "bg-muted" : ""}`} aria-current={d === today ? "date" : undefined}>
              <div className="text-xs text-muted-foreground">{t(`agenda.weekdays.${i + 1}`)}</div>
              <div className="font-heading text-[22px] font-semibold leading-tight">{Number(d.slice(8))}</div>
            </div>
          ))}
        </div>
        <div className={`${cols} pt-2`}>
          <div aria-hidden="true">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR }} className="-translate-y-[7px] pr-2 text-right text-[11px] text-muted-foreground">
                {hourLabel(`${h}:00`)}
              </div>
            ))}
          </div>
          {days.map((d, i) => {
            const off = noClassOn(data, d);
            return (
              <ul
                key={d}
                aria-label={`${t(`agenda.weekdays.${i + 1}`)} ${Number(d.slice(8))}`}
                data-day={d}
                className="relative border-l border-divider"
                style={{ height, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${HOUR - 1}px, var(--divider) ${HOUR - 1}px ${HOUR}px)` }}
              >
                {off && (
                  <li
                    data-no-class
                    className="absolute inset-0 flex items-start justify-center pt-[140px]"
                    style={{ background: "repeating-linear-gradient(135deg, var(--divider) 0 8px, var(--muted) 8px 16px)" }}
                  >
                    <div className="w-[120px] rounded-lg border bg-card p-2.5 text-center">
                      <div className="text-[13px] font-semibold">{t("agenda.noClass")}</div>
                      <div className="text-xs text-muted-foreground">{off.reason}</div>
                    </div>
                  </li>
                )}
                {data.lessons
                  .filter((l) => l.date === d)
                  .map((l) => (
                    <GridLessonCard key={l.id} lesson={l} top={((minutes(l.startsAt) - first * 60) * HOUR) / 60 + 2} height={((minutes(l.endsAt) - minutes(l.startsAt)) * HOUR) / 60 - 4} />
                  ))}
              </ul>
            );
          })}
        </div>
      </div>
    </div>
  );
}

