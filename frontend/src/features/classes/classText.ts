import type { TFunction } from "i18next";

type Slot = { weekday: number; startsAt: string; endsAt: string };

// "19:30" vira "19h30"; "07:00" vira "7h" (sem zero à esquerda e sem ":00").
export const hourText = (hhmm: string) => hhmm.slice(0, 5).replace(/^0/, "").replace(":00", "h").replace(":", "h");

const list = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

// RF-TUR-01 (canvas): dias agrupados pelo horário, "Seg, Qua e Sex · 19h30–21h"; horários diferentes viram um trecho cada, separados por " · ".
export function scheduleText(t: TFunction, schedule: Slot[]): string {
  if (schedule.length === 0) return t("classes.none");
  const groups = new Map<string, { days: string[]; from: string; to: string }>();
  for (const s of [...schedule].sort((a, b) => a.weekday - b.weekday)) {
    const key = `${s.startsAt}-${s.endsAt}`;
    const g = groups.get(key) ?? { days: [], from: hourText(s.startsAt), to: hourText(s.endsAt) };
    g.days.push(t(`classes.weekdays.${s.weekday}`));
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => t("classes.slotText", { days: list.format(g.days), from: g.from, to: g.to })).join(" · ");
}
