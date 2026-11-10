import i18n from "@/i18n";
import { chargeName, classLabel, monthLabel, planDescription, scheduleText } from "./modalityDialogSummary";

const t = i18n.t.bind(i18n);

describe("textos das janelas de ação do aluno", () => {
  it("horário: dias com o mesmo horário juntos, 7h e 19h30", () => {
    expect(scheduleText(t, [{ weekday: 4, startsAt: "07:00", endsAt: "08:00" }, { weekday: 2, startsAt: "07:00", endsAt: "08:00" }])).toBe("Ter e Qui 7h");
    expect(scheduleText(t, [1, 3, 5].map((weekday) => ({ weekday, startsAt: "19:30", endsAt: "20:30" })))).toBe("Seg, Qua e Sex 19h30");
    expect(scheduleText(t, [{ weekday: 6, startsAt: "10:00", endsAt: "11:00" }, { weekday: 1, startsAt: "19:00", endsAt: "20:00" }])).toBe("Seg 19h, Sáb 10h");
    expect(scheduleText(t)).toBe("");
  });

  it("turma com horário e ocupação, só com alunos (sem limite) ou só o nome", () => {
    const schedule = [2, 4].map((weekday) => ({ weekday, startsAt: "07:00", endsAt: "08:00" }));
    expect(classLabel(t, { id: "k", name: "Jiu-Jitsu Adulto · Manhã", schedule, activeStudents: 18, capacity: 25 })).toBe("Jiu-Jitsu Adulto · Manhã (Ter e Qui 7h) · 18 de 25");
    expect(classLabel(t, { id: "k", name: "No-Gi Adulto", schedule: [{ weekday: 6, startsAt: "10:00", endsAt: "11:00" }], activeStudents: 14, capacity: null })).toBe("No-Gi Adulto (Sáb 10h) · 14 alunos");
    expect(classLabel(t, { id: "k", name: "Turma Manhã" })).toBe("Turma Manhã");
  });

  it("descrição do plano: Nx por semana ou Livre", () => {
    expect(planDescription(t, { id: "p", name: "A", weeklyFrequency: 3 })).toBe("3x por semana");
    expect(planDescription(t, { id: "p", name: "A", weeklyFrequency: null })).toBe("Livre");
    expect(planDescription(t, { id: "p", name: "A" })).toBeUndefined();
  });

  it("mês no fuso da unidade: 31/10 às 23h em São Paulo ainda é outubro, mesmo já sendo novembro em UTC", () => {
    const now = new Date("2026-11-01T02:00:00Z");
    expect(monthLabel(t, 0, now)).toBe("out/2026");
    expect(monthLabel(t, 1, now)).toBe("nov/2026");
    expect(monthLabel(t, -1, now)).toBe("set/2026");
    expect(monthLabel(t, 2, new Date("2026-11-10T12:00:00Z"))).toBe("jan/2027");
    expect(monthLabel(t, -11, new Date("2026-11-10T12:00:00Z"))).toBe("dez/2025");
  });
});

describe("cobrança da janela Encerrar", () => {
  const now = new Date("2026-10-05T15:00:00Z");
  it("vencida há N dias ou vence dd/mm, no fuso da unidade", () => {
    expect(chargeName(t, "Muay Thai", { referenceMonth: "2026-09-01", dueOn: "2026-09-10" }, now)).toBe("Muay Thai · set/2026 · vencida há 25 dias");
    expect(chargeName(t, "Muay Thai", { referenceMonth: "2026-10-01", dueOn: "2026-10-10" }, now)).toBe("Muay Thai · out/2026 · vence 10/10");
    expect(chargeName(t, "Muay Thai", { referenceMonth: null, dueOn: "2026-10-04" }, now)).toBe("Muay Thai · 04/10/2026 · vencida há 1 dia");
  });
});
