// Datas da agenda como texto yyyy-MM-dd, sem fuso: a conta é feita ao meio-dia local para o horário de verão não mudar o dia.
const at = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayIso = () => toIso(new Date());
export const addDays = (iso: string, n: number) => {
  const d = at(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
/** 1 (segunda) a 7 (domingo), como o servidor. */
export const weekday = (iso: string) => ((at(iso).getDay() + 6) % 7) + 1;
export const mondayOf = (iso: string) => addDays(iso, 1 - weekday(iso));
export const weekDays = (iso: string) => Array.from({ length: 7 }, (_, i) => addDays(mondayOf(iso), i));
export const br = (iso: string) => iso.split("-").reverse().join("/");
export const brShort = (iso: string) => br(iso).slice(0, 5);

const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("pt-BR", o).format(at(iso));
/** "12 a 18 de outubro de 2026"; atravessando meses, "28 de setembro a 4 de outubro de 2026". */
export function rangeLabel(from: string, to: string) {
  const [a, b] = [at(from), at(to)];
  const full = { day: "numeric", month: "long" } as const;
  if (a.getFullYear() !== b.getFullYear()) return `${fmt(from, { ...full, year: "numeric" })} a ${fmt(to, { ...full, year: "numeric" })}`;
  if (a.getMonth() !== b.getMonth()) return `${fmt(from, full)} a ${fmt(to, { ...full, year: "numeric" })}`;
  return `${a.getDate()} a ${fmt(to, { ...full, year: "numeric" })}`;
}
/** "07:00" vira "7h" e "08:30" vira "8h30". */
export const hourLabel = (hhmm: string) => {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
};
export const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
