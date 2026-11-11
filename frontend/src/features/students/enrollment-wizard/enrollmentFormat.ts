// Idade em anos completos de uma data "AAAA-MM-DD" (a data de hoje é a do navegador, ou a passada).
export function ageOf(birthDate: string, today: Date = new Date()): number {
  const [y, m, d] = birthDate.split("-").map(Number);
  const had = today.getMonth() + 1 > m || (today.getMonth() + 1 === m && today.getDate() >= d);
  return today.getFullYear() - y - (had ? 0 : 1);
}

// CPF mascarado: só o grupo do meio e os dois dígitos finais aparecem.
export function maskCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.***-${d.slice(9)}` : "";
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// "2026-10-08" vira "out/2026".
export function monthYear(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]}/${y}`;
}

// "2026-11-10" menos 10 dias vira "31/10" (a segunda cobrança é gerada 10 dias antes do vencimento, RN-MAT-07).
export function dayMonthBefore(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d - days));
  return `${String(t.getUTCDate()).padStart(2, "0")}/${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
}
