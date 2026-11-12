// Filtro "Período" (D5): um mês de vencimento no endereço como AAAA-MM; a rota recebe `from` e `to` (primeiro e último dia).
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

export function periodLabel(value: string): string {
  const [year, month] = value.split("-").map(Number);
  const name = monthName.format(new Date(Date.UTC(year, month - 1, 1)));
  return `${name[0].toUpperCase()}${name.slice(1)}/${year}`;
}

// Seis meses antes, o atual e dois depois, em ordem cronológica.
export function periodOptions(now: Date): { id: string; name: string }[] {
  return Array.from({ length: 9 }, (_, i) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 6 + i, 1));
    const id = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { id, name: periodLabel(id) };
  });
}

export function periodRange(value: string): { from: string; to: string } | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${value}-01`, to: `${value}-${String(last).padStart(2, "0")}` };
}
