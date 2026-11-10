import type { TFunction } from "i18next";
import { DEFAULT_TZ, formatDate } from "@/lib/format";

const k = "students.record.enrollment.";

export interface Slot {
  weekday: number;
  startsAt: string;
  endsAt: string;
}
/** Turma como a lista `/classes` a traz; só `id` e `name` são obrigatórios (a matrícula e os testes antigos não trazem o resto). */
export interface ClassChoice {
  id: string;
  name: string;
  schedule?: Slot[];
  activeStudents?: number;
  capacity?: number | null;
}
/** Plano como a lista `/plans` o traz. */
export interface PlanChoice {
  id: string;
  name: string;
  valueCents?: number;
  weeklyFrequency?: 2 | 3 | null;
}

const list = (items: string[]) => new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(items);

/** "Ter e Qui 7h": dias com o mesmo horário juntos; "19:30" vira "19h30". */
export function scheduleText(t: TFunction, schedule: Slot[] = []): string {
  const byStart = new Map<string, number[]>();
  for (const s of [...schedule].sort((a, b) => a.weekday - b.weekday)) byStart.set(s.startsAt, [...(byStart.get(s.startsAt) ?? []), s.weekday]);
  return [...byStart]
    .map(([start, days]) => {
      const [h, m] = start.split(":");
      return `${list(days.map((d) => t(`classes.weekdays.${d}`)))} ${t(`${k}slotTime`, { h: Number(h), m: m === "00" ? "" : m })}`;
    })
    .join(", ");
}

/** "Jiu-Jitsu Adulto · Manhã (Ter e Qui 7h) · 18 de 25". */
export function classLabel(t: TFunction, c: ClassChoice): string {
  const when = c.schedule?.length ? ` (${scheduleText(t, c.schedule)})` : "";
  const filled = c.activeStudents === undefined ? "" : ` · ${c.capacity != null ? t(`${k}occupancy`, { count: c.activeStudents, max: c.capacity }) : t(`${k}enrolled`, { count: c.activeStudents })}`;
  return `${c.name}${when}${filled}`;
}

/** "3x por semana" ou "Livre". */
export const planDescription = (t: TFunction, p: PlanChoice): string | undefined => (p.weeklyFrequency === undefined ? undefined : p.weeklyFrequency ? t(`${k}plan.perWeek`, { count: p.weeklyFrequency }) : t(`${k}plan.free`));

/** "nov/2026": o mês de hoje mais `offset`, contado no fuso da unidade. */
export function monthLabel(t: TFunction, offset = 0, now: Date = new Date(), timeZone = DEFAULT_TZ): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric" }).formatToParts(now).map((x) => [x.type, Number(x.value)]));
  const index = p.year * 12 + (p.month - 1) + offset;
  return `${t(`${k}months.${(index % 12) + 1}`)}/${Math.floor(index / 12)}`;
}

/** "set/2026" a partir do mês de referência da cobrança ("2026-09-01"); sem ele, a data de vencimento. */
export function chargeMonth(t: TFunction, ref: string | null, dueOn: string): string {
  const m = ref && /^(\d{4})-(\d{2})/.exec(ref);
  return m ? `${t(`${k}months.${Number(m[2])}`)}/${m[1]}` : formatDate(dueOn);
}

const dayNumber = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000;

/** "Muay Thai · set/2026 · vencida há 25 dias" ou "... · vence 10/10", pelo dia de hoje no fuso da unidade. */
export function chargeName(t: TFunction, modality: string, c: { referenceMonth: string | null; dueOn: string }, now: Date = new Date(), timeZone = DEFAULT_TZ): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  const late = dayNumber(today) - dayNumber(c.dueOn);
  const when = late > 0 ? t(`${k}end.overdueDays`, { count: late }) : t(`${k}end.dueOn`, { date: formatDate(c.dueOn).slice(0, 5) });
  return `${modality} · ${chargeMonth(t, c.referenceMonth, c.dueOn)} · ${when}`;
}
