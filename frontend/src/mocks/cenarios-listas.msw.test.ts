import { resetMockSession, setScenarios } from "./handlers";

const json = { "Content-Type": "application/json" };
const login = (email: string) => fetch("/api/v1/auth/login", { method: "POST", headers: json, body: JSON.stringify({ email, password: "segredo123" }) });
const get = async (path: string) => (await fetch(`/api/v1${path}`)).json();
const day = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

// Quarta-feira, meio-dia em São Paulo: day() (data UTC) e o dia da unidade coincidem em qualquer hora de quem roda.
afterEach(() => vi.useRealTimers());
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T15:00:00Z"));
  setScenarios(true);
  resetMockSession();
  await login("ana@exemplo.com");
});

describe("cenário da agenda e das listas (#449)", () => {
  it("CA16: a semana tem aula cancelada, com substituição, dia sem aula e aula avulsa", async () => {
    const agenda = await get(`/agenda?from=${day(0)}&to=${day(6)}`);
    const lessons = agenda.lessons as { status: string; substitute: boolean; class: unknown; cancelReasonCode: string | null; date: string }[];
    expect(lessons.some((l) => l.status === "CANCELLED" && l.date !== day(0) && l.cancelReasonCode === "TEACHER_UNAVAILABLE")).toBe(true);
    expect(lessons.some((l) => l.substitute)).toBe(true);
    expect(lessons.some((l) => l.class === null)).toBe(true);
    expect((await get("/agenda?from=2026-11-09&to=2026-11-15")).noClassDays).toEqual([{ startsOn: "2026-11-13", endsOn: "2026-11-13", reason: "Feriado sintético" }]); // #692: sexta da semana do relógio fixo (11/11)
  });

  it("CA17: 6 professores (ativo, convite enviado, inativo)", async () => {
    const t = await get("/teachers");
    expect(t.total).toBe(6);
    expect(t.items.filter((x: { status: string }) => x.status === "INACTIVE")).toHaveLength(2);
    expect(t.items.some((x: { access: string }) => x.access === "PENDING")).toBe(true);
    expect(t.items.some((x: { status: string; access: string }) => x.status === "ACTIVE" && x.access === "ACTIVE")).toBe(true);
  });

  it("CA17: benefícios com alto, encerrado e vencido", async () => {
    const b = (await get("/benefits")) as { high: boolean; status: string }[] | { items: { high: boolean; status: string }[] };
    const list = Array.isArray(b) ? b : b.items;
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(list.some((x) => x.high)).toBe(true);
    expect(list.some((x) => x.status === "ENDED")).toBe(true);
    expect(list.some((x) => x.status === "EXPIRED")).toBe(true);
  });

  it("CA17: 10 planos (5 do cenário base e 5 do canvas, dois desativados, vários que valem nas outras unidades)", async () => {
    const p = await get("/plans");
    expect(p.total).toBe(10);
    expect(p.items.some((x: { status: string }) => x.status === "INACTIVE")).toBe(true);
    expect(p.items.some((x: { validOtherUnits: boolean }) => x.validOtherUnits)).toBe(true);
  });

  it("CA17: 5 comunicados (agendado, enviado com lidos, aula cancelada)", async () => {
    const a = await get("/announcements");
    expect(a.total).toBe(5);
    expect(a.items.some((x: { status: string }) => x.status === "SCHEDULED")).toBe(true);
    expect(a.items.some((x: { reads: number }) => x.reads > 0)).toBe(true);
    expect(a.items.some((x: { type: string }) => x.type === "CANCELED_CLASS")).toBe(true);
  });

  it("CA17: 6 usuários da gestão (um com convite enviado) e 3 unidades (uma desativada)", async () => {
    const u = await get("/users");
    expect(u).toHaveLength(6);
    expect(u.some((x: { status: string }) => x.status === "PENDING")).toBe(true);
    const units = await get("/units");
    expect(units).toHaveLength(3);
    expect(units.filter((x: { active: boolean }) => !x.active)).toHaveLength(1);
  });
});

describe("cenário dos planos do canvas (#480)", () => {
  it("quatro planos ativos (58, 21, 22 e 30 alunos) e um desativado por Carla Mendes com histórico de duas linhas", async () => {
    const list = await get("/plans?size=100");
    const byName = Object.fromEntries((list.items as { name: string; studentsUsing: number; status: string; id: string }[]).map((p) => [p.name, p]));
    expect([byName["Adulto 3x"], byName["Adulto livre"], byName["Kids 2x"], byName["Adulto 2x"]].map((p) => p.studentsUsing)).toEqual([58, 21, 22, 30]);
    expect(byName["Adulto 2x (antigo)"].status).toBe("INACTIVE");
    const old = await get(`/plans/${byName["Adulto 2x (antigo)"].id}`);
    expect(old.deactivation.by).toBe("Carla Mendes");
    expect(old.valueHistory).toHaveLength(2);
    expect(old.studentsUsing).toBe(3);
    const main = await get(`/plans/${byName["Adulto 3x"].id}`);
    expect(main.lastChange.by).toBe("Marcos Leão");
    const impact = await get(`/plans/${byName["Adulto 3x"].id}/value-impact?valueCents=19000`);
    expect(impact).toEqual({ studentsAffected: 58, effectiveFrom: "NEXT_CHARGE", unpaidCharges: 6, paidFutureCharges: 2 });
    expect((await get("/plans/summary")).benefits.active).toBeGreaterThan(0);
  });
});
