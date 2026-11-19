import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { PortalScheduleData, ScheduleLesson } from "./usePortalSchedule";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "Ana Silva" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "GUARDIAN", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const jiu = { id: "m1", name: "Jiu-Jitsu" };
const judo = { id: "m2", name: "Judô" };
const centro = { id: "u1", name: "Centro" };
const lesson = (over: Partial<ScheduleLesson>): ScheduleLesson => ({
  id: "l0",
  date: "2026-10-27",
  startsAt: "19:00",
  endsAt: "20:00",
  title: "Jiu-Jitsu Adulto",
  kind: "MAIN",
  status: "SCHEDULED",
  cancelReasonCode: null,
  cancelReason: null,
  changed: false,
  originalDate: null,
  originalStartsAt: null,
  substitute: false,
  past: false,
  noticeId: null,
  modality: jiu,
  unit: centro,
  teacherName: "Prof. Carlos Teste",
  ...over,
});
const schedule = (over: Partial<PortalScheduleData> = {}): PortalScheduleData => ({
  reduced: false,
  students: [{ id: "s1", name: "Ana Souza", self: true }],
  studentId: "s1",
  scope: "ALL",
  weekStart: "2026-10-26",
  weekEnd: "2026-11-01",
  today: "2026-10-27",
  timezone: "America/Sao_Paulo",
  lessons: [
    lesson({ id: "a", date: "2026-10-26", startsAt: "18:00", endsAt: "19:00", title: "Jiu-Jitsu Manhã", past: true, kind: "OTHER" }),
    lesson({ id: "b", changed: true, originalDate: "2026-10-26", originalStartsAt: "18:00", noticeId: "n1" }),
    lesson({ id: "c", date: "2026-10-29", status: "CANCELLED", cancelReasonCode: "HOLIDAY", title: "Judô Adulto", modality: judo }),
    lesson({ id: "d", date: "2026-10-30", status: "CANCELLED", cancelReasonCode: "OTHER", cancelReason: "Reforma <b>do</b> tatame", title: "Judô Noite", modality: judo }),
    lesson({ id: "e", date: "2026-10-31", kind: "ADHOC", title: "Seminário", substitute: true, changed: true, teacherName: "Prof. Marta Teste" }),
  ],
  noClassDays: [{ date: "2026-10-28", reason: "Feriado municipal", unit: centro }],
  ...over,
});
const serve = (data: PortalScheduleData | ((info: { request: Request }) => Response | Promise<Response>)) =>
  server.use(http.get("/api/v1/portal/schedule", typeof data === "function" ? data : () => HttpResponse.json(data)));

function viewport(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide && query.includes("min-width"),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

function setup(path = "/portal/agenda") {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/portal/term", () => HttpResponse.json([])),
    http.get("/api/v1/portal/students", () => HttpResponse.json([])),
    http.get("/api/v1/portal/shell", () => HttpResponse.json({ organization: { name: "Academia Alfa", color: null, logoUrl: null }, reduced: false, unreadAnnouncements: 0 })),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("PortalAgendaPage (RF-POR-04)", () => {
  beforeEach(() => viewport(false));

  it("lista do dia (CA7): começa em hoje, com Alterada, resumo, Ver aviso, Sem aula, Cancelada com o motivo, Avulsa; setas passam o dia e a semana", async () => {
    const asked: string[] = [];
    serve(({ request }) => {
      asked.push(new URL(request.url).search);
      return HttpResponse.json(schedule());
    });
    const user = userEvent.setup();
    setup();
    expect(await screen.findByRole("heading", { name: /terça, 27\/10/ })).toBeInTheDocument();
    expect(screen.getByText("19h–20h")).toBeInTheDocument();
    expect(screen.getByText("Alterada")).toBeInTheDocument();
    expect(screen.getByText("Era em 26/10/2026 às 18:00")).toBeInTheDocument();
    expect(screen.getByText("Prof. Carlos Teste · turma principal · Centro")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver aviso sobre Jiu-Jitsu Adulto" })).toHaveAttribute("href", "/portal/avisos?aviso=n1");
    expect(screen.queryByText("Já aconteceu")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Modalidade/ })).not.toBeInTheDocument();
    expect(screen.getByText("Sem presença nem frequência. Para mudar de turma, faça um pedido em Minhas informações.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dia anterior" }));
    expect(screen.getByText("Já aconteceu")).toBeInTheDocument();
    expect(screen.getByText("Outro horário · Prof. Carlos Teste · Centro")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(screen.getByText("Sem aula")).toBeInTheDocument();
    expect(screen.getByText(/Feriado municipal/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(screen.getByText("Cancelada")).toBeInTheDocument();
    expect(screen.getByText("Motivo: Feriado")).toBeInTheDocument();
    expect(screen.getByText("Judô Adulto")).toHaveClass("line-through");
    expect(screen.queryByRole("link", { name: /Ver aviso/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(screen.getByText("Motivo: Reforma <b>do</b> tatame")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(screen.getByText("Aula avulsa · Centro")).toBeInTheDocument();
    expect(screen.getByText("Professor substituto: Prof. Marta Teste")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/presen[^ç]|frequ[^ê]|progress|espera|R\$/i);

    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    expect(screen.getByText("Nenhuma aula neste dia.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próximo dia" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?week=2026-11-02"));
  });

  it("controles (CA1, CA2, CA9): escopo, semana e aluno refazem a leitura e mantêm os outros parâmetros", async () => {
    viewport(true);
    const asked: string[] = [];
    serve(({ request }) => {
      asked.push(new URL(request.url).search);
      return HttpResponse.json(
        schedule({
          students: [
            { id: "s1", name: "Ana Souza", self: false },
            { id: "s2", name: "Beto Souza", self: false },
          ],
        }),
      );
    });
    const user = userEvent.setup();
    setup();
    expect(await screen.findByText("26 de outubro a 1 de novembro")).toBeInTheDocument();
    expect(screen.getByText("Só consulta")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Todos os meus horários" })).toBeChecked();
    expect(screen.queryByRole("button", { name: "Hoje" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Semana de/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima semana" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?week=2026-11-02"));
    await user.click(screen.getByRole("radio", { name: "Só minha turma" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?week=2026-11-02&scope=MAIN"));
    expect(screen.getByRole("radio", { name: "Só minha turma" })).toBeChecked();
    await user.selectOptions(screen.getByLabelText("Aluno"), "s2");
    await waitFor(() => expect(asked.at(-1)).toBe("?studentId=s2&week=2026-11-02&scope=MAIN"));
    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?studentId=s2&week=2026-10-19&scope=MAIN"));
    await user.click(screen.getByRole("radio", { name: "Todos os meus horários" }));
    await waitFor(() => expect(asked.at(-1)).toBe("?studentId=s2&week=2026-10-19"));
  });

  it("controles (CA3): o filtro de modalidade é do cliente e mostra só as aulas da escolhida", async () => {
    viewport(true);
    const asked: string[] = [];
    serve(({ request }) => {
      asked.push(new URL(request.url).search);
      return HttpResponse.json(schedule());
    });
    const user = userEvent.setup();
    setup();
    await screen.findByRole("region", { name: "Qua 28/10" });
    await user.click(screen.getByRole("button", { name: /Modalidade/ }));
    expect(within(screen.getByRole("listbox")).getAllByRole("option").map((o) => o.textContent)).toEqual(["Todas", "Jiu-Jitsu", "Judô"]);
    await user.click(screen.getByRole("option", { name: "Judô" }));
    expect(screen.queryByText("Jiu-Jitsu Adulto")).not.toBeInTheDocument();
    expect(screen.getByText("Judô Adulto")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Modalidade/ }));
    await user.click(screen.getByRole("option", { name: "Todas" }));
    expect(screen.getByText("Jiu-Jitsu Adulto")).toBeInTheDocument();
    expect(asked).toHaveLength(1);
  });

  it("grade (CA4 a CA6): 7 colunas com as aulas de cada dia, a faixa de dia sem aula com o motivo e traço nos dias vazios; sem a legenda", async () => {
    viewport(true);
    serve(schedule());
    setup();
    const wed = await screen.findByRole("region", { name: "Qua 28/10" });
    expect(screen.getAllByRole("region")).toHaveLength(7);
    expect(within(wed).getByText("Sem aula")).toBeInTheDocument();
    expect(within(wed).getByText("Feriado municipal")).toBeInTheDocument();
    const tue = screen.getByRole("region", { name: "Ter 27/10" });
    expect(within(tue).getByText("19h")).toBeInTheDocument();
    expect(within(tue).getByText("Alterada")).toBeInTheDocument();
    expect(within(tue).getByText("Era em 26/10/2026 às 18:00")).toBeInTheDocument();
    expect(within(tue).getByRole("link", { name: "Ver aviso sobre Jiu-Jitsu Adulto" })).toHaveAttribute("href", "/portal/avisos?aviso=n1");
    const mon = screen.getByRole("region", { name: "Seg 26/10" });
    expect(within(mon).getByText("Já aconteceu")).toBeInTheDocument();
    expect(within(mon).getByText("Outro horário · Prof. Carlos Teste")).toBeInTheDocument();
    const thu = screen.getByRole("region", { name: "Qui 29/10" });
    expect(within(thu).getByText("Judô Adulto")).toHaveClass("line-through");
    expect(within(thu).getByText("Cancelada")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Sáb 31/10" })).getByText("Aula avulsa")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Dom 01/11" })).getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("Legenda")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Sem presença nem frequência. Para mudar de turma, faça um pedido em Minhas informações.")).toBeInTheDocument();
  });

  it("?aluno=, ?semana= e ?escopo= na URL chegam à leitura", async () => {
    const asked: string[] = [];
    serve(({ request }) => {
      asked.push(new URL(request.url).search);
      return HttpResponse.json(schedule());
    });
    setup("/portal/agenda?aluno=s2&semana=2026-11-02&escopo=MAIN");
    await screen.findByRole("heading", { name: /terça, 27\/10/ });
    expect(asked).toEqual(["?studentId=s2&week=2026-11-02&scope=MAIN"]);
  });

  it("estados: semana sem aulas mostra o vazio; a semana sem hoje abre na segunda", async () => {
    serve(schedule({ lessons: [], noClassDays: [] }));
    const empty = setup();
    expect(await screen.findByText("Nenhuma aula nesta semana")).toBeInTheDocument();
    empty.unmount();
    serve(schedule({ today: "2026-10-20" }));
    setup();
    expect(await screen.findByRole("heading", { name: /segunda, 26\/10/ })).toBeInTheDocument();
  });

  it("estados: carregando, erro com Tentar de novo e sem permissão", async () => {
    serve(() => new Promise<Response>(() => {}));
    const loading = setup();
    expect((await screen.findAllByRole("status")).length).toBeGreaterThan(0);
    loading.unmount();

    let calls = 0;
    serve(() => (++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(schedule())));
    const user = userEvent.setup();
    const failed = setup();
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: /terça, 27\/10/ })).toBeInTheDocument();
    expect(calls).toBe(2);
    failed.unmount();

    serve(() => new HttpResponse(null, { status: 403 }));
    setup();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  for (const dark of [false, true]) {
    for (const wide of [false, true]) {
      it(`sem violações de acessibilidade no tema ${dark ? "escuro" : "claro"}, ${wide ? "grade" : "lista"}`, async () => {
        setDevicePrefersDark(dark);
        viewport(wide);
        serve(schedule());
        const { container } = setup();
        await screen.findByRole(wide ? "region" : "heading", wide ? { name: "Sáb 31/10" } : { name: /terça, 27\/10/ });
        await waitFor(async () => expect(await axeViolations(container)).toEqual([]));
      });
    }
  }
});
