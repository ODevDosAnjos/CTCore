import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { addDays, brShort, mondayOf, rangeLabel, todayIso } from "./agendaDates";
import type { AgendaData, AgendaLesson } from "./useAgenda";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});

const monday = () => mondayOf(todayIso());
const lesson = (over: Partial<AgendaLesson>): AgendaLesson => ({
  id: "l1",
  date: monday(),
  startsAt: "19:00",
  endsAt: "20:00",
  status: "SCHEDULED",
  cancelReason: null,
  cancelReasonCode: null,
  class: { id: "c1", name: "Jiu-Jitsu Adulto" },
  title: null,
  unit: { id: "u1", name: "Centro" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  teacher: { id: "t1", name: "Ana Souza" },
  substitute: false,
  canEdit: true,
  canCancel: true,
  activeStudents: 10,
  trialClasses: 0,
  ...over,
});
const data = (over: Partial<AgendaData> = {}): AgendaData => ({
  units: [{ id: "u1", name: "Centro" }],
  unit: { id: "u1", name: "Centro" },
  teachers: [{ id: "t1", name: "Ana Souza" }],
  modalities: [
    { id: "m1", name: "Jiu-Jitsu" },
    { id: "m2", name: "Judô" },
  ],
  lessons: [
    lesson({}),
    lesson({ id: "l2", date: addDays(monday(), 1), class: { id: "c2", name: "Judô Infantil" }, modality: { id: "m2", name: "Judô" }, startsAt: "18:00", endsAt: "19:00", status: "CANCELLED", cancelReason: "Chuva forte" }),
    lesson({ id: "l3", date: addDays(monday(), 2), substitute: true, teacher: { id: "t2", name: "João Pereira" } }),
  ],
  noClassDays: [{ startsOn: addDays(monday(), 3), endsOn: addDays(monday(), 3), reason: "Feriado local" }],
  ...over,
});

let calls: URLSearchParams[];

function setup(opts: { role?: string; width?: number; body?: () => Response | Promise<Response>; view?: AgendaData } = {}) {
  calls = [];
  window.innerWidth = opts.width ?? 1280;
  window.history.replaceState(null, "", "/agenda");
  const role = opts.role ?? "COORDINATOR";
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }] })),
    http.get("/api/v1/agenda", ({ request }) => {
      calls.push(new URL(request.url).searchParams);
      return opts.body ? opts.body() : HttpResponse.json(opts.view ?? data());
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/agenda"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Agenda", level: 1 });

// Quarta-feira, meio-dia em São Paulo: o teste não depende do dia da semana nem da hora de quem roda.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T15:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("AgendaPage", () => {
  it("CA3, CA6, CA7: grade da semana com turma, professor, selos, cancelada riscada e Sem aula com o motivo", async () => {
    setup();
    await ready();
    const cell = (await screen.findAllByText("Jiu-Jitsu Adulto"))[0].closest("li")!;
    expect(within(cell).getByText("Ana Souza")).toBeInTheDocument();
    expect(within(cell).getByText("19h–20h")).toBeInTheDocument();
    const cancelled = screen.getByText("Judô Infantil").closest("li")!;
    expect(screen.getByText("Judô Infantil")).toHaveClass("line-through");
    expect(within(cancelled).getByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("Substituição")).toBeInTheDocument();
    const off = screen.getByText("Sem aula").closest("li")!;
    expect(off).toHaveAttribute("data-no-class");
    expect(within(off).getByText("Feriado local")).toBeInTheDocument();
    expect(screen.getByLabelText("Seg " + Number(monday().slice(8)))).toBeInTheDocument();
    expect(screen.getByText("Jiu-Jitsu", { selector: "li" })).toBeInTheDocument(); // legenda
    expect(calls[0].get("from")).toBe(monday());
    expect(calls[0].get("to")).toBe(addDays(monday(), 6));
  });

  it("CA5: escala de 7h a 21h, cartão a 2 px e a 522 px com 74 px e 48 px; aula às 22h estende a escala", async () => {
    const day = monday();
    setup({
      view: data({
        lessons: [
          lesson({ id: "a", date: day, startsAt: "07:00", endsAt: "08:30" }),
          lesson({ id: "b", date: day, startsAt: "17:00", endsAt: "18:00", class: { id: "c9", name: "Boxe" } }),
        ],
        noClassDays: [],
      }),
    });
    await ready();
    const a = (await screen.findByText("Jiu-Jitsu Adulto")).closest("li")!;
    expect(a).toHaveStyle({ top: "2px", height: "74px" });
    expect(screen.getByText("Boxe").closest("li")).toHaveStyle({ top: "522px", height: "48px" });
    expect(screen.getByText("7h–8h30")).toBeInTheDocument();
    expect(screen.getByLabelText("Seg " + Number(day.slice(8)))).toHaveStyle({ height: "780px" });
  });

  it("CA5: uma aula às 22h estende a escala até 23h", async () => {
    setup({ view: data({ lessons: [lesson({ startsAt: "22:00", endsAt: "23:00" })], noClassDays: [] }) });
    await ready();
    await screen.findByText("Jiu-Jitsu Adulto");
    expect(screen.getByLabelText("Seg " + Number(monday().slice(8)))).toHaveStyle({ height: "832px" });
  });

  it("CA6: aula avulsa e experimentais ganham selo; sem experimental, nenhum", async () => {
    setup({ view: data({ lessons: [lesson({ id: "av", class: null, title: "Seminário", trialClasses: 1 }), lesson({ id: "x", startsAt: "10:00", endsAt: "11:00" })], noClassDays: [] }) });
    await ready();
    expect(await screen.findByText("Avulsa")).toBeInTheDocument();
    expect(screen.getByText("1 experimental")).toBeInTheDocument();
    expect(screen.queryAllByText(/experimental/)).toHaveLength(1);
  });

  it("CA1, CA2: cabeçalho com subtítulo da unidade, Dias sem aula, Nova aula avulsa e sem parágrafo de introdução", async () => {
    setup();
    await ready();
    expect(await screen.findByText("Unidade Centro · 8 semanas sempre criadas a partir dos horários das turmas")).toBeInTheDocument();
    expect(within(screen.getByRole("heading", { level: 1 }).closest("header")!).getByRole("link", { name: "Dias sem aula" })).toHaveAttribute("href", "/dias-sem-aula");
    expect(screen.getByRole("button", { name: "Nova aula avulsa" })).toBeInTheDocument();
    expect(screen.queryByText(/As aulas da semana da sua unidade/)).toBeNull();
  });

  it("CA2: o Professor sem Dias sem aula não vê o link", async () => {
    setup({ role: "TEACHER" });
    await ready();
    await screen.findByText("Substituição");
    expect(within(screen.getByRole("heading", { level: 1 }).closest("header")!).queryByRole("link", { name: "Dias sem aula" })).toBeNull();
  });

  it("CA3: Esta semana marcada, Próxima semana avança 7 dias e a marca muda; setas movem 7 dias; faixa por extenso", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Substituição");
    expect(screen.getByRole("radio", { name: "Esta semana" })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: "Próxima semana" }));
    await waitFor(() => expect(calls.at(-1)!.get("from")).toBe(addDays(monday(), 7)));
    expect(screen.getByRole("radio", { name: "Próxima semana" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Próxima semana" }));
    await waitFor(() => expect(calls.at(-1)!.get("from")).toBe(addDays(monday(), 14)));
    expect(screen.getByRole("radio", { name: "Esta semana" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Próxima semana" })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Hoje" }));
    await waitFor(() => expect(calls.at(-1)!.get("from")).toBe(monday()));
    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    await waitFor(() => expect(calls.at(-1)!.get("from")).toBe(addDays(monday(), -7)));
    expect(screen.getByText("2 a 8 de novembro de 2026")).toBeInTheDocument();
  });

  it("CA4: escolher a modalidade refaz a consulta e a pílula mostra o nome; filtro de professor refaz a consulta", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Substituição");
    await user.click(screen.getByRole("button", { name: /Professor/ }));
    await user.click(await screen.findByRole("option", { name: "Ana Souza" }));
    await waitFor(() => expect(calls.at(-1)!.get("teacherId")).toBe("t1"));
    await user.click(screen.getByRole("button", { name: /Modalidade/ }));
    await user.click(await screen.findByRole("option", { name: "Judô" }));
    await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBe("m2"));
    expect(screen.getByRole("button", { name: "Modalidade Judô" })).toBeInTheDocument();
  });

  it("CA13: com mais de uma unidade aparece o seletor e escolher refaz a consulta sem os filtros antigos", async () => {
    const user = userEvent.setup();
    setup({ view: data({ units: [{ id: "u1", name: "Centro" }, { id: "u2", name: "Norte" }] }) });
    await user.selectOptions(await screen.findByLabelText("Unidade"), "u2");
    await waitFor(() => expect(calls.at(-1)!.get("unitId")).toBe("u2"));
    expect(calls.at(-1)!.get("teacherId")).toBeNull();
  });

  it("CA14: a 360 px mostra só o dia, setas cruzam a semana, Hoje volta ao dia atual e dia sem aulas mostra o vazio", async () => {
    const user = userEvent.setup();
    setup({ width: 360 });
    await ready();
    const today = todayIso();
    expect(await screen.findByRole("region", { name: new RegExp(brShort(today)) })).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Dia anterior" }));
    await user.click(screen.getByRole("button", { name: "Dia anterior" }));
    await user.click(screen.getByRole("button", { name: "Hoje" }));
    expect(screen.getByRole("button", { name: "Próximo dia" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(await screen.findByRole("region", { name: new RegExp(brShort(addDays(today, 1))) })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Esta semana" }));
    expect(await screen.findByRole("region", { name: new RegExp(brShort(addDays(today, 1))) })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hoje" }));
    expect(await screen.findByRole("region", { name: new RegExp(brShort(today)) })).toBeInTheDocument();
  });

  it("CA14: a lista do dia mostra cancelada riscada, selo e Sem aula com o motivo", async () => {
    const day = todayIso();
    setup({
      width: 360,
      view: data({
        lessons: [lesson({ id: "x1", date: day, status: "CANCELLED", cancelReason: "Chuva", substitute: true }), lesson({ id: "x2", date: day, startsAt: "20:00", endsAt: "21:00", class: { id: "c3", name: "Boxe Noite" } })],
        noClassDays: [{ startsOn: day, endsOn: day, reason: "Feriado local" }],
      }),
    });
    await ready();
    expect(await screen.findByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("Jiu-Jitsu Adulto")).toHaveClass("line-through");
    expect(screen.getByText("Substituição")).toBeInTheDocument();
    expect(screen.getByText(/sem aula · Feriado local/)).toBeInTheDocument();
    expect(screen.getByText("Boxe Noite")).toBeInTheDocument();
  });

  it("CA9, celular: cabeçalho do dia, hora grande com até, N alunos, aviso de dia sem aula, pílulas e Nova aula avulsa ao pé", async () => {
    const day = todayIso();
    setup({
      width: 390,
      view: data({
        lessons: [lesson({ id: "m1", date: day, startsAt: "07:00", endsAt: "08:30", activeStudents: 12, trialClasses: 1 })],
        noClassDays: [{ startsOn: addDays(day, 1), endsOn: addDays(day, 1), reason: "Feriado local" }],
      }),
    });
    await ready();
    const card = (await screen.findByText("Jiu-Jitsu Adulto")).closest("li")!;
    expect(within(card).getByText("7h")).toBeInTheDocument();
    expect(within(card).getByText("até 8h30")).toBeInTheDocument();
    expect(within(card).getByText("Ana Souza · 12 alunos")).toBeInTheDocument();
    expect(within(card).getByText("1 experimental")).toBeInTheDocument();
    expect(screen.getByText(/^1 aula · Centro$/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Professor/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Modalidade/ })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(await screen.findByText(/sem aula · Feriado local/)).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: "Nova aula avulsa" });
    expect(buttons).toHaveLength(1);
  });

  it("CA10, celular: o Professor vê só título com setas, sem pílulas, com unidade, chevron e selo de substituição", async () => {
    const day = todayIso();
    setup({
      role: "TEACHER",
      width: 390,
      view: data({
        lessons: [
          lesson({ id: "p1", date: day, activeStudents: 8, trialClasses: 2 }),
          lesson({ id: "p2", date: day, startsAt: "20:00", endsAt: "21:00", substitute: true, class: { id: "c5", name: "Boxe" }, activeStudents: 5 }),
        ],
        noClassDays: [],
      }),
    });
    await ready();
    const a = (await screen.findByText("Jiu-Jitsu Adulto")).closest("li")!;
    expect(within(a).getByText("Centro · 8 alunos · 2 experimentais")).toBeInTheDocument();
    expect(within(screen.getByText("Boxe").closest("li")!).getByText("Substituição")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Professor Todos/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Hoje" })).toBeNull();
    expect(screen.getByRole("button", { name: "Dia anterior" })).toBeInTheDocument();
  });

  it("CA14: dia sem aulas na lista mostra o estado vazio", async () => {
    setup({ width: 360, view: data({ lessons: [], noClassDays: [] }) });
    expect(await screen.findByText("Nenhuma aula neste período")).toBeInTheDocument();
  });

  it("CA15: carregando, vazio, erro com Tentar de novo e sem permissão", async () => {
    const user = userEvent.setup();
    let fail = true;
    const view = () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(data({ lessons: [], noClassDays: [] })));
    setup({ body: view });
    expect(await screen.findByText("Carregando...")).toBeInTheDocument();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Nenhuma aula neste período")).toBeInTheDocument();
  });

  it("CA15: sem permissão quando o servidor responde 403", async () => {
    setup({ body: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each(["COORDINATOR", "ADMINISTRATOR", "TEACHER"])("%s vê Agenda em Operação e chega à tela", async (role) => {
    setup({ role });
    await ready();
    expect(screen.getAllByRole("link", { name: "Agenda" })[0]).toHaveAttribute("href", "/agenda");
  });

  it("CA12: o arquivo de tradução da tela não menciona lista de espera, presença nem frequência", () => {
    const text = JSON.stringify(JSON.parse(readFileSync(join(process.cwd(), "src/i18n/pt-BR.json"), "utf8")).agenda);
    expect(text).not.toMatch(/presen|frequ|espera/i);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA15: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    const { container } = setup({ width: 360 });
    await ready();
    await waitFor(() => expect(screen.queryByText("Carregando...")).toBeNull());
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA15: a grade a 1280 px não tem violações no axe", async () => {
    const { container } = setup();
    await screen.findByText("Substituição");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("agendaDates", () => {
  it("D2: faixa por extenso, com mês e ano quando a semana cruza meses", () => {
    expect(rangeLabel("2026-10-12", "2026-10-18")).toBe("12 a 18 de outubro de 2026");
    expect(rangeLabel("2026-09-28", "2026-10-04")).toBe("28 de setembro a 4 de outubro de 2026");
    expect(rangeLabel("2026-12-28", "2027-01-03")).toBe("28 de dezembro de 2026 a 3 de janeiro de 2027");
  });
});
