import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { gate } from "@/test/gate";
import { pickPill } from "@/test/pill";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { enrollmentOf, modalityRow } from "@/features/students/enrollmentFixtures";
import { SITUATIONS, type ChargeRow } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const charge = (over: Partial<ChargeRow> = {}): ChargeRow => ({
  id: "c1",
  student: { id: "s1", name: "Ana Souza", photoUrl: null },
  unit: { id: "u1", name: "Centro" },
  type: "MONTHLY",
  modality: { id: "m1", name: "Jiu-Jitsu" },
  referenceMonth: "2026-03-01",
  description: null,
  amountCents: 12000,
  dueOn: "2026-03-05",
  status: "OVERDUE",
  payment: null,
  daysLate: 25,
  ...over,
});
const paid = charge({
  id: "c2",
  student: { id: "s2", name: "João Pereira", photoUrl: "https://files.example/foto.png" },
  status: "PAID",
  daysLate: null,
  payment: { method: "PIX_MP", paidAt: "2026-03-04T15:00:00Z", amountCents: 18090 },
});
const fee = charge({ id: "c3", student: { id: "s3", name: "Maria Lima", photoUrl: null }, type: "ENROLLMENT_FEE", modality: null, referenceMonth: null, description: "Taxa de matrícula", status: "PENDING", daysLate: null });
const counts = { overdue: 4, dueToday: 2, inReview: 1, paidMonth: 7, all: 128 };
const totals = (count: number, amountCents: number) => ({ count, amountCents, paidCents: 18090, openCents: amountCents - 18090 });

let calls: URLSearchParams[];

function setup(role = "COORDINATOR", list?: (p: URLSearchParams) => Response | Promise<Response>, path = "/cobrancas", permissions: Record<string, string> = mockPermissions(role)) {
  calls = [];
  window.history.replaceState(null, "", path);
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }, { id: "u2", name: "Norte", shortName: "n" }] })),
    http.get("/api/v1/age-ranges", () => HttpResponse.json({ canManage: false, items: [] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([{ id: "m1", name: "Jiu-Jitsu", active: true }])),
    http.get("/api/v1/classes", () => HttpResponse.json({ items: [{ id: "k1", name: "Turma Noite" }], page: 1, size: 100, total: 1 })),
    http.get("/api/v1/charges", ({ request }) => {
      const p = new URL(request.url).searchParams;
      calls.push(p);
      if (list) return list(p);
      return HttpResponse.json({ items: [charge(), paid, fee], page: 1, size: 25, total: 3, counts, totals: totals(3, 36000) });
    }),
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

const ready = () => screen.findByRole("heading", { name: "Cobranças", level: 1 });
const tableRow = (name: string) => screen.getAllByText(name).map((e) => e.closest("tr")).find(Boolean)!;

describe("ChargesPage (RF-COB-01)", () => {
  it("CA6: colunas com aluno (foto ou avatar), referência em duas linhas, valor, vencimento, situação com dias, meio com valor pago e sem coluna Unidade; pede vencimento decrescente", async () => {
    setup();
    await ready();
    await screen.findAllByText("Ana Souza");
    const row = tableRow("Ana Souza");
    expect(within(row).getByText("AS")).toBeInTheDocument();
    expect(within(row).getByText("Jiu-Jitsu · 03/2026")).toBeInTheDocument();
    expect(within(row).getByText("Mensalidade")).toBeInTheDocument();
    expect(within(row).getByText(/120,00/)).toBeInTheDocument();
    expect(within(row).getByText("05/03/2026")).toBeInTheDocument();
    expect(within(row).getByText("Em atraso")).toBeInTheDocument();
    expect(within(row).getByText("25 dias")).toBeInTheDocument();
    expect(within(row).getByText("—")).toBeInTheDocument();
    expect(within(row).queryByText("Centro")).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Unidade" })).toBeNull();
    const other = tableRow("João Pereira");
    expect(within(other).getByText("Paga")).toBeInTheDocument();
    expect(within(other).getByText(/^Pix · .*180,90/)).toBeInTheDocument();
    expect(within(other).queryByText(/dias?$/)).toBeNull();
    expect(document.querySelector("img[src='https://files.example/foto.png']")).not.toBeNull();
    expect(within(tableRow("Maria Lima")).getAllByText("Taxa de matrícula")).toHaveLength(2);
    expect(calls.at(-1)!.get("sort")).toBe("dueOn,desc");
    expect(calls.at(-1)!.get("size")).toBe("25");
  });

  it("CA1 (R1): subtítulo com a regra, os quatro botões; Exportar CSV é Em breve e não responde; Nova cobrança abre a janela; somem os botões antigos", async () => {
    const user = userEvent.setup();
    setup("ADMINISTRATOR");
    await ready();
    expect(screen.getByText(/^Todas as unidades · sem juros, multa ou pagamento parcial · taxas do meio de pagamento repassadas ao aluno$/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Recebimentos do dia" })).toHaveAttribute("href", "/cobrancas/recebimentos");
    expect(screen.getByRole("link", { name: "Prévia da geração" })).toHaveAttribute("href", "/cobrancas/previa");
    const exportCsv = screen.getByRole("button", { name: "Exportar CSV" });
    expect(exportCsv).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    await user.click(exportCsv);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("button", { name: "Gerar próximas mensalidades" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Nova cobrança avulsa" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Em atraso" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Nova cobrança" }));
    expect(await screen.findByRole("dialog", { name: "Nova cobrança avulsa" })).toBeInTheDocument();
  });

  it("CA4 (R3): as abas ficam sem número até a primeira resposta; depois Todas mostra o total do alcance e as outras as contagens", async () => {
    const hold = gate();
    setup("COORDINATOR", async () => {
      await hold.opened;
      return HttpResponse.json({ items: [charge()], page: 1, size: 25, total: 1, counts, totals: totals(1, 12000) });
    });
    await ready();
    expect(screen.getByRole("button", { name: "Todas" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Em atraso" })).toBeInTheDocument();
    hold.release();
    expect(await screen.findByRole("button", { name: "Todas, 128" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Em atraso, 4" })).toBeInTheDocument();
  });

  it("CA9 (R8): erro 500 mostra o cartão com os dois botões, mantendo cabeçalho e abas; Tentar de novo recarrega", async () => {
    const user = userEvent.setup();
    let fail = false;
    setup("COORDINATOR", () => (fail ? HttpResponse.json({ code: "X", message: "m", fields: [], traceId: "t" }, { status: 500 }) : HttpResponse.json({ items: [charge()], page: 1, size: 25, total: 1, counts, totals: totals(1, 12000) })));
    await screen.findAllByText("Ana Souza");
    fail = true;
    await user.click(screen.getByRole("button", { name: "Em atraso, 4" }));
    expect(await screen.findByText("Não foi possível carregar as cobranças")).toBeInTheDocument();
    expect(screen.getByText("A conexão caiu no meio do caminho. Nada foi alterado. Se continuar, fale com o suporte.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Falar com o suporte" }).getAttribute("href")).toMatch(/^mailto:/);
    expect(screen.getByRole("heading", { name: "Cobranças", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Todas, 128" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Período/ })).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect((await screen.findAllByText("Ana Souza")).length).toBeGreaterThan(0);
  });

  it("CA9: 403 do servidor mostra sem permissão dentro do cartão", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN", message: "m", fields: [], traceId: "t" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA9: sem filtro o vazio é o de nada ainda; com filtro, sem resultado e Limpar filtros", async () => {
    const user = userEvent.setup();
    const empty = () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0, counts, totals: totals(0, 0) });
    setup("COORDINATOR", empty);
    expect(await screen.findByText("Nada por aqui ainda")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Em atraso, 4" }));
    expect(await screen.findByRole("button", { name: "Limpar filtros" })).toBeInTheDocument();
  });

  it("CA16/R12: cada situação aparece com texto traduzido", async () => {
    const rows = SITUATIONS.map((status, i) => charge({ id: `x${i}`, student: { id: `s${i}`, name: `Aluno ${i}`, photoUrl: null }, status, daysLate: null }));
    setup("COORDINATOR", () => HttpResponse.json({ items: rows, page: 1, size: 25, total: 9, counts, totals: totals(9, 108000) }));
    await screen.findAllByText("Aluno 0");
    const names = ["Pendente", "Vence hoje", "Em atraso", "Em conferência", "Paga", "Paga com atraso", "Cancelada", "Renegociada", "Estornada"];
    const table = screen.getAllByRole("table")[0];
    for (const n of names) expect(within(table).getByText(n)).toBeInTheDocument();
  });

  it("CA4, CA7: o endereço vira a consulta, a aba fica ativa, o rodapé traz a soma e Pago/Em aberto do filtro e trocar a aba volta à página 1", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () => HttpResponse.json({ items: [charge()], page: 2, size: 25, total: 30, counts, totals: totals(30, 360000) }), "/cobrancas?quick=OVERDUE&pagina=2");
    await screen.findAllByText("Ana Souza");
    expect(calls.at(-1)!.get("quick")).toBe("OVERDUE");
    expect(calls.at(-1)!.get("page")).toBe("2");
    expect(screen.getByRole("button", { name: "Em atraso, 4" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Vence hoje, 2" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Em conferência, 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagas no mês, 7" })).toBeInTheDocument();
    expect(screen.getByText("1 de 30 cobranças")).toBeInTheDocument();
    expect(screen.getByText(/^R\$.*3\.600,00$/)).toBeInTheDocument();
    expect(screen.getByText(/^Pago R\$.*180,90 · Em aberto R\$.*3\.419,10$/)).toBeInTheDocument();
    expect(screen.getByText("26–30 de 30")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vence hoje, 2" }));
    await waitFor(() => expect(calls.at(-1)!.get("quick")).toBe("DUE_TODAY"));
    expect(calls.at(-1)!.get("page")).toBe("1");
    await user.click(screen.getByRole("button", { name: "Todas, 128" }));
    await waitFor(() => expect(calls.at(-1)!.get("quick")).toBeNull());
  });

  it("CA5 (R4): período do mês, situação, tipo, modalidade e turma combinam na consulta; sem seletor de unidade nem campo de data; a busca guarda q", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T15:00:00Z"));
    try {
      const user = userEvent.setup();
      setup();
      await screen.findAllByText("Ana Souza");
      expect(within(screen.getByRole("search")).queryByRole("button", { name: /^Unidade/ })).toBeNull();
      expect(screen.queryByLabelText("Vencimento de")).toBeNull();
      expect(document.querySelector("input[type='date']")).toBeNull();
      await pickPill(user, "Período", "Outubro/2026");
      await pickPill(user, "Situação", "Paga");
      await pickPill(user, "Tipo", "Mensalidade");
      await waitFor(() => expect(screen.getByRole("button", { name: /^Modalidade/ })).toBeEnabled());
      await waitFor(async () => {
        await pickPill(user, "Modalidade", "Jiu-Jitsu");
      });
      await waitFor(async () => {
        await pickPill(user, "Turma", "Turma Noite");
      });
      await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "ana");
      await waitFor(() => expect(calls.at(-1)!.get("q")).toBe("ana"));
      const p = calls.at(-1)!;
      expect(Object.fromEntries(["from", "to", "status", "type", "unitId", "modalityId", "classId", "period"].map((k) => [k, p.get(k)]))).toEqual({
        from: "2026-10-01", to: "2026-10-31", status: "PAID", type: "MONTHLY", unitId: null, modalityId: "m1", classId: "k1", period: null,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("ordenar por valor pede amount,asc e depois amount,desc", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findAllByText("Ana Souza");
    await user.click(screen.getByRole("button", { name: "Ordenar por Valor" }));
    await waitFor(() => expect(calls.at(-1)!.get("sort")).toBe("amount,asc"));
    await user.click(screen.getByRole("button", { name: "Ordenar por Valor" }));
    await waitFor(() => expect(calls.at(-1)!.get("sort")).toBe("amount,desc"));
  });

  it("CA6 (D6): clicar na linha abre o painel; o menu ... tem rótulo, Abrir cobrança funciona e as demais ações ficam Em breve", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/v1/charges/:id", () => HttpResponse.json({ code: "NOT_FOUND", message: "m", fields: [], traceId: "t" }, { status: 404 })));
    setup();
    await screen.findAllByText("Ana Souza");
    await user.click(within(tableRow("João Pereira")).getByText("05/03/2026"));
    expect(await screen.findByText("Cobrança não encontrada.")).toBeInTheDocument();
    cleanup();
    setup();
    await screen.findAllByText("Ana Souza");
    const menu = screen.getByRole("button", { name: "Ações da cobrança de Ana Souza: Jiu-Jitsu · 03/2026" });
    expect(menu).toHaveAttribute("aria-expanded", "false");
    await user.click(menu);
    expect(screen.getByRole("menuitem", { name: "Registrar pagamento" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Cancelar cobrança" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Renegociar" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("menuitem", { name: "Abrir cobrança" }));
    expect(await screen.findByText("Cobrança não encontrada.")).toBeInTheDocument();
  });

  it("CA10: Professor não vê Cobranças no menu e a rota o leva a Sem acesso", async () => {
    setup("TEACHER");
    expect(await screen.findByText("Esta área não está disponível para o seu perfil")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cobranças" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Cobranças e pagamentos" })).toBeNull();
  });

  it("CA18: a 360 px o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { container, unmount } = setup();
      await ready();
      await screen.findAllByText("Ana Souza");
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});

describe("ChargesPage · celular (R7)", () => {
  afterEach(() => setDeviceNarrow(false));

  it("CA8: a 390 px o título leva Mês/Ano e a contagem, só a linha de pílulas e os cartões; busca e filtros ficam na folha; Nova cobrança vai ao pé", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-15T15:00:00Z"));
    try {
      const user = userEvent.setup();
      setDeviceNarrow(true);
      window.innerWidth = 390;
      setup("ADMINISTRATOR");
      await ready();
      const card = (await screen.findByText("Ana Souza")).closest("li")!;
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.getByText("Outubro/2026 · 3 cobranças")).toBeInTheDocument();
      expect(within(card).getByText("Jiu-Jitsu · 03/2026")).toBeInTheDocument();
      expect(within(card).getByText("Em atraso")).toBeInTheDocument();
      expect(within(card).getByText("venceu 05/03 · 25 dias")).toBeInTheDocument();
      expect(within(card).getByText(/120,00/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Todas, 128" })).toBeInTheDocument();
      expect(screen.queryByRole("searchbox")).toBeNull();
      expect(screen.queryByRole("button", { name: /^Período/ })).toBeNull();
      expect(screen.queryByRole("link", { name: "Prévia da geração" })).toBeNull();
      const create = screen.getAllByRole("button", { name: "Nova cobrança" });
      expect(create).toHaveLength(1);
      expect(create[0]).toHaveClass("w-full");
      await user.click(screen.getByRole("button", { name: "Filtros" }));
      const sheet = await screen.findByRole("dialog", { name: "Filtros" });
      expect(within(sheet).getByRole("searchbox")).toBeInTheDocument();
      expect(within(sheet).getByLabelText("Período")).toBeInTheDocument();
      expect(within(sheet).getByLabelText("Situação")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("CA8: na folha de filtros a busca e a situação entram na consulta", async () => {
    const user = userEvent.setup();
    setDeviceNarrow(true);
    setup();
    await screen.findByText("Ana Souza");
    await user.click(screen.getByRole("button", { name: "Filtros" }));
    const sheet = await screen.findByRole("dialog", { name: "Filtros" });
    await user.type(within(sheet).getByRole("searchbox"), "ana");
    await user.selectOptions(within(sheet).getByLabelText("Situação"), "PAID");
    await waitFor(() => expect(calls.at(-1)!.get("q")).toBe("ana"));
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBe("PAID"));
  });

  it("CA8: tocar no cartão abre o painel da cobrança", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/v1/charges/:id", () => HttpResponse.json({ code: "NOT_FOUND", message: "m", fields: [], traceId: "t" }, { status: 404 })));
    setDeviceNarrow(true);
    setup();
    await screen.findByText("Ana Souza");
    await user.click(screen.getByRole("button", { name: "Abrir cobrança de Ana Souza: Jiu-Jitsu · 03/2026" }));
    expect(await screen.findByText("Cobrança não encontrada.")).toBeInTheDocument();
  });

  it("CA8: na aba Em atraso o pé mostra quantas cobranças e a soma", async () => {
    setDeviceNarrow(true);
    setup("COORDINATOR", () => HttpResponse.json({ items: [charge()], page: 1, size: 25, total: 11, counts, totals: totals(11, 191000) }), "/cobrancas?quick=OVERDUE");
    await screen.findByText("Ana Souza");
    expect(screen.getByText("11 cobranças em atraso")).toBeInTheDocument();
    expect(screen.getByText(/^R\$.*1\.910,00$/)).toBeInTheDocument();
    cleanup();
    setup();
    await screen.findByText("Ana Souza");
    expect(screen.queryByText(/cobranças em atraso$/)).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA8: os cartões a 360 px não têm violações no axe no tema %s", async (_n, dark) => {
    setDeviceNarrow(true, dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findByText("Ana Souza");
    expect(container.querySelector("table")).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("botões de criação (RF-COB-07, CA1, CA2)", () => {
  it("COLLECTIONS completo vê Nova cobrança; só consulta não vê", async () => {
    const { unmount } = setup("ADMINISTRATOR");
    await ready();
    expect(await screen.findByRole("button", { name: "Nova cobrança" })).toBeInTheDocument();
    unmount();
    setup("COORDINATOR", undefined, "/cobrancas", { ...mockPermissions("COORDINATOR"), COLLECTIONS: "READ" });
    await ready();
    await screen.findAllByText("Ana Souza");
    expect(screen.queryByRole("button", { name: "Nova cobrança" })).toBeNull();
    expect(screen.getByRole("link", { name: "Recebimentos do dia" })).toBeInTheDocument();
  });

  it("criar a avulsa fecha a janela e recarrega a lista", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/v1/students", () => HttpResponse.json({ items: [{ id: "s1", name: "Ana Souza" }], page: 1, size: 25, total: 1 })),
      http.get("/api/v1/students/s1/enrollment", () => HttpResponse.json(enrollmentOf([modalityRow()]))),
      http.post("/api/v1/students/s1/charges", () => HttpResponse.json(charge({ id: "n1", type: "ONE_OFF" }), { status: 201 })),
    );
    setup("COORDINATOR");
    await ready();
    await screen.findAllByText("Ana Souza");
    const before = calls.length;
    await user.click(screen.getByRole("button", { name: "Nova cobrança" }));
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "an");
    await user.selectOptions(await screen.findByLabelText("Aluno"), "s1");
    await user.type(await screen.findByLabelText("Descrição"), "Kimono");
    await user.type(screen.getByLabelText("Valor"), "10000");
    fireEvent.change(screen.getByLabelText("Vencimento"), { target: { value: "2099-01-10" } });
    await user.click(screen.getByRole("button", { name: "Criar cobrança" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
  });

  it("R13, D2: o atalho Em conferência ligado mostra o link para a conferência; o link Ver atrasados leva à tela de lembretes", async () => {
    setup("COORDINATOR", undefined, "/cobrancas?quick=IN_REVIEW");
    await screen.findAllByText("Ana Souza");
    expect(screen.getByRole("link", { name: "Abrir conferência" })).toHaveAttribute("href", "/cobrancas/conferencia");
    expect(screen.getByRole("link", { name: "Ver atrasados" })).toHaveAttribute("href", "/cobrancas/atrasados");
    cleanup();
    setup("COORDINATOR");
    await screen.findAllByText("Ana Souza");
    expect(screen.queryByRole("link", { name: "Abrir conferência" })).toBeNull();
  });
});
