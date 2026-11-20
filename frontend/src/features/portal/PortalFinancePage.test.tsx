import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { FinanceCharge, PortalFinanceData } from "./usePortalFinance";

// FormData e File do jsdom não passam pelo fetch do Node: o envio é trocado por um duplo simples e o resto usa o MSW.
const send = vi.hoisted(() => ({ calls: [] as unknown[][] }));
vi.mock("./usePixProof", async (original) => ({
  ...(await original<typeof import("./usePixProof")>()),
  sendProof: (...args: unknown[]) => {
    send.calls.push(args);
    return Promise.resolve([]);
  },
}));

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "Ana Silva" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "GUARDIAN", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const centro = { id: "u1", name: "Centro" };
const norte = { id: "u2", name: "Norte" };
const charge = (over: Partial<FinanceCharge>): FinanceCharge => ({
  id: "c1",
  studentId: "s1",
  studentName: "Ana Souza",
  type: "MONTHLY",
  description: null,
  referenceLabel: "Jiu-Jitsu · 10/2026",
  referenceMonth: "2026-10-01",
  dueOn: "2026-10-05",
  situation: "OVERDUE",
  amountCents: 9000,
  planCents: 10000,
  benefitCents: 1000,
  canPay: true,
  modality: { id: "m1", name: "Jiu-Jitsu" },
  unit: centro,
  ...over,
});
const finance = (over: Partial<PortalFinanceData> = {}): PortalFinanceData => ({
  reduced: false,
  students: [{ id: "s1", name: "Ana Souza", photoUrl: null, self: true, openCents: 21000 }],
  selectedStudentId: "s1",
  scope: "STUDENT",
  year: 2026,
  years: [2026, 2025],
  familyOpenCents: 21000,
  open: [
    charge({}),
    charge({ id: "c2", referenceLabel: "Kimono", type: "ONE_OFF", referenceMonth: null, dueOn: "2026-11-20", situation: "PENDING", amountCents: 3000, planCents: 3000, benefitCents: 0 }),
    charge({ id: "c3", referenceLabel: "Judô · 10/2026", situation: "IN_REVIEW", canPay: false, amountCents: 9000, unit: norte }),
    charge({ id: "c4", referenceLabel: "Seminário", situation: "DUE_SOON", amountCents: 4000, planCents: 4000, benefitCents: 0, unit: norte }),
  ],
  history: [
    { id: "h1", referenceLabel: "Jiu-Jitsu · 03/2026", dueOn: "2026-03-05", amountCents: 12000, status: "PAID", paidAt: "2026-03-04T15:00:00Z", method: "PIX_KEY", receipt: { number: 7, code: "RC-7" } },
    { id: "h2", referenceLabel: "Jiu-Jitsu · 02/2026", dueOn: "2026-02-05", amountCents: 12000, status: "CANCELED", paidAt: null, method: null, receipt: null },
  ],
  ...over,
});
const serve = (data: PortalFinanceData | ((info: { request: Request }) => Response | Promise<Response>)) =>
  server.use(http.get("/api/v1/portal/finance", typeof data === "function" ? data : () => HttpResponse.json(data)));
const batch = {
  pixKey: "pix@alfa.test",
  totalCents: 12000,
  unit: "Centro",
  charges: [
    { chargeId: "c1", studentName: "Ana Souza", amountCents: 9000, dueOn: "2026-10-05" },
    { chargeId: "c2", studentName: "Ana Souza", amountCents: 3000, dueOn: "2026-11-20" },
  ],
};

function Where() {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{pathname + search}</span>;
}
function setup(path = "/portal/financeiro") {
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
          <Where />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("PortalFinancePage (RF-POR-05)", () => {
  beforeEach(() => {
    send.calls.length = 0;
  });

  it("abertas: tabela na ordem do servidor, subtítulo, Em conferência sem caixa, sem Pagar por linha nem composição; histórico e débito automático (CA1, CA3)", async () => {
    serve(finance());
    setup();
    const open = within(await screen.findByRole("region", { name: "Em aberto" }));
    expect(open.getByText("vencidas primeiro")).toBeInTheDocument();
    expect(open.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Seleção", "Cobrança", "Vencimento", "Valor", "Situação"]);
    const rows = open.getAllByRole("row").slice(1);
    expect(rows.map((r) => within(r).getAllByRole("cell")[1].textContent)).toEqual(["Jiu-Jitsu · 10/2026", "Kimono", "Judô · 10/2026", "Seminário"]);
    expect(within(rows[0]).getByText("05/10/2026")).toBeInTheDocument();
    expect(within(rows[0]).getByText("Vencida")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Em conferência")).toBeInTheDocument();
    expect(within(rows[2]).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(open.getAllByRole("checkbox")).toHaveLength(3);
    expect(open.queryByRole("button", { name: /^Pagar / })).not.toBeInTheDocument();
    expect(open.queryByText("Composição")).not.toBeInTheDocument();

    const history = within(screen.getByRole("region", { name: "Histórico" }));
    expect(history.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Referência", "Vencimento", "Valor pago", "Pago em", "Meio", "Situação", "Recibo"]);
    expect(history.getByText("04/03/2026")).toBeInTheDocument();
    expect(history.getByText("Pix pela chave")).toBeInTheDocument();
    expect(history.queryByRole("combobox")).not.toBeInTheDocument();
    expect(history.getByRole("link", { name: "Baixar recibo de Jiu-Jitsu · 03/2026" })).toHaveAttribute("href", "/api/v1/portal/receipts/RC-7/pdf");
    expect(history.getByText("Cancelada")).toBeInTheDocument();

    const debit = within(screen.getByRole("region", { name: "Débito automático" }));
    expect(debit.queryByText("Inativo")).not.toBeInTheDocument();
    expect(debit.getByRole("button", { name: "Ativar" })).toHaveAttribute("aria-disabled", "true");
    expect(debit.getByText("Em breve")).toBeInTheDocument();
    const receipts = within(screen.getByRole("region", { name: "Recibos por e-mail" }));
    expect(receipts.getByText(/^Chegam em .+ a cada pagamento.$/)).toBeInTheDocument();
  });

  it("abertas: no celular as linhas viram cartões (CA1)", async () => {
    setDeviceNarrow(true);
    try {
      serve(finance());
      setup();
      const open = within(await screen.findByRole("region", { name: "Em aberto" }));
      expect(open.queryByRole("table")).not.toBeInTheDocument();
      const items = open.getAllByRole("listitem");
      expect(items).toHaveLength(4);
      expect(within(items[0]).getByText("venceu 05/10")).toBeInTheDocument();
      expect(within(items[1]).getByText("vence 20/11")).toBeInTheDocument();
    } finally {
      setDevicePrefersDark(false);
    }
  });

  it("histórico: no celular as linhas são compactas, com Meio · dia, valor e ícone de recibo (CA4)", async () => {
    setDeviceNarrow(true);
    try {
      serve(finance());
      setup();
      const history = within(await screen.findByRole("region", { name: "Histórico" }));
      expect(history.queryByRole("table")).not.toBeInTheDocument();
      const first = history.getAllByRole("listitem")[0];
      expect(within(first).getByText("Pix pela chave · 04/03")).toBeInTheDocument();
      expect(within(first).getByRole("link", { name: "Baixar recibo de Jiu-Jitsu · 03/2026" })).toBeInTheDocument();
    } finally {
      setDevicePrefersDark(false);
    }
  });

  it("abertas: marcar duas da mesma unidade soma o total, Pagar fica em breve e Enviar comprovante abre a janela; o arquivo único é enviado e a lista relida (CA2)", async () => {
    let reads = 0;
    serve(() => HttpResponse.json((reads++, finance())));
    server.use(http.get("/api/v1/portal/charges/pix-instructions", ({ request }) => (new URL(request.url).searchParams.get("ids") === "c1,c2" ? HttpResponse.json(batch) : HttpResponse.json({}, { status: 404 }))));
    const user = userEvent.setup();
    setup();
    const open = within(await screen.findByRole("region", { name: "Em aberto" }));
    await user.click(open.getByRole("checkbox", { name: "Selecionar Jiu-Jitsu · 10/2026" }));
    await user.click(open.getByRole("checkbox", { name: "Selecionar Kimono" }));
    expect(open.getByRole("status")).toHaveTextContent("2 selecionadas · R$ 120,00");
    const pay = open.getByRole("button", { name: "Pagar R$ 120,00" });
    expect(pay).toHaveAttribute("aria-disabled", "true");
    expect(open.getByText("Em breve")).toBeInTheDocument();
    await user.click(pay);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(open.getByRole("button", { name: "Enviar comprovante de Pix" }));

    const dialog = within(await screen.findByRole("dialog", { name: "Pix na chave com comprovante" }));
    expect(await dialog.findByText("pix@alfa.test")).toBeInTheDocument();
    expect(dialog.getByText(/120,00 \(sem taxa\)/)).toBeInTheDocument();
    expect(dialog.getAllByRole("listitem")).toHaveLength(2);
    await user.upload(dialog.getByLabelText(/Comprovante \(JPG/), new File(["x"], "comprovante.png", { type: "image/png" }));
    await user.click(dialog.getByRole("button", { name: "Enviar comprovante" }));
    expect(await dialog.findByText("Comprovante enviado. A cobrança ficou em conferência.")).toBeInTheDocument();
    expect(send.calls).toEqual([[["c1", "c2"], expect.any(File)]]);
    await waitFor(() => expect(reads).toBe(2));
  });

  it("abertas: unidades diferentes mostram o aviso e desabilitam Enviar comprovante; desmarcar libera (CA2)", async () => {
    serve(finance());
    const user = userEvent.setup();
    setup();
    const open = within(await screen.findByRole("region", { name: "Em aberto" }));
    await user.click(open.getByRole("checkbox", { name: "Selecionar Jiu-Jitsu · 10/2026" }));
    await user.click(open.getByRole("checkbox", { name: "Selecionar Seminário" }));
    expect(open.getByRole("alert")).toHaveTextContent("Escolha cobranças da mesma unidade para pagar juntas.");
    expect(open.getByRole("button", { name: "Enviar comprovante de Pix" })).toBeDisabled();
    await user.click(open.getByRole("checkbox", { name: "Selecionar Seminário" }));
    expect(open.queryByRole("alert")).not.toBeInTheDocument();
    expect(open.getByRole("button", { name: "Enviar comprovante de Pix" })).toBeEnabled();
  });

  it("abertas: uma cobrança marcada abre a janela com uma só", async () => {
    serve(finance());
    server.use(http.get("/api/v1/portal/charges/c2/pix-instructions", () => HttpResponse.json({ chargeId: "c2", pixKey: "pix@alfa.test", amountCents: 3000, dueOn: "2026-11-20", unit: "Centro" })));
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("checkbox", { name: "Selecionar Kimono" }));
    await user.click(screen.getByRole("button", { name: "Enviar comprovante de Pix" }));
    const dialog = within(await screen.findByRole("dialog", { name: "Pix na chave com comprovante" }));
    expect(await dialog.findByText(/30,00 \(sem taxa\)/)).toBeInTheDocument();
    expect(dialog.queryByRole("list")).not.toBeInTheDocument();
  });

  it("abertas da família: agrupadas por unidade, cada grupo com o seu resumo (CA5)", async () => {
    const two = [
      { id: "s1", name: "Ana Souza", photoUrl: null, self: true, openCents: 12000 },
      { id: "s2", name: "Davi Souza", photoUrl: null, self: false, openCents: 5000 },
    ];
    serve(finance({ students: two, scope: "FAMILY", familyOpenCents: 17000, history: [], open: [charge({}), charge({ id: "c9", studentId: "s2", studentName: "Davi Souza", referenceLabel: "Judô · 10/2026", unit: norte })] }));
    const user = userEvent.setup();
    setup("/portal/financeiro?visao=familia");
    const open = within(await screen.findByRole("region", { name: "Em aberto" }));
    const centro = within(open.getByRole("region", { name: "Unidade: Centro" }));
    const north = within(open.getByRole("region", { name: "Unidade: Norte" }));
    expect(centro.getByText("Ana Souza")).toBeInTheDocument();
    expect(north.getByText("Davi Souza")).toBeInTheDocument();
    await user.click(centro.getByRole("checkbox", { name: "Selecionar Jiu-Jitsu · 10/2026 · Ana Souza" }));
    expect(centro.getByRole("status")).toHaveTextContent("1 selecionadas · R$ 90,00");
    expect(north.queryByRole("status")).not.toBeInTheDocument();
  });

  it("CA9: seletor de aluno com Toda a família; a visão lista as cobranças com o aluno, sem histórico, e muda ?visao=", async () => {
    const two = [
      { id: "s1", name: "Ana Souza", photoUrl: null, self: true, openCents: 12000 },
      { id: "s2", name: "Davi Souza", photoUrl: null, self: false, openCents: 5000 },
    ];
    const seen: string[] = [];
    serve(({ request }) => {
      const q = new URL(request.url).searchParams;
      seen.push(q.toString());
      if (q.get("scope") === "FAMILY") return HttpResponse.json(finance({ students: two, scope: "FAMILY", familyOpenCents: 17000, history: [], open: [charge({}), charge({ id: "c9", studentId: "s2", studentName: "Davi Souza", referenceLabel: "Judô · 10/2026" })] }));
      return HttpResponse.json(finance({ students: two, selectedStudentId: q.get("studentId") ?? "s1", familyOpenCents: 17000 }));
    });
    const user = userEvent.setup();
    setup();
    const chips = await screen.findByRole("group", { name: "Aluno" });
    expect(within(chips).getAllByRole("button").map((o) => o.textContent)).toEqual(["AS" + "Você", "DS" + "Davi Souza", "Toda a família"]);
    await user.click(within(chips).getByRole("button", { name: "Toda a família" }));
    expect(await screen.findByText("R$ 170,00 em aberto")).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent("/portal/financeiro?visao=familia");
    expect(await screen.findByText("Davi Souza", { selector: "span" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Histórico" })).not.toBeInTheDocument();
    expect(seen).toContain("scope=FAMILY");

    await user.click(within(screen.getByRole("group", { name: "Aluno" })).getByRole("button", { name: /Davi Souza/ }));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/portal/financeiro?aluno=s2"));
    expect(await screen.findByRole("region", { name: "Histórico" })).toBeInTheDocument();
    expect(seen.at(-1)).toBe("studentId=s2");
  });

  it("CA9: trocar o ano refaz o histórico e muda ?ano=", async () => {
    serve(({ request }) => {
      const year = Number(new URL(request.url).searchParams.get("year") ?? 2026);
      return HttpResponse.json(finance({ year, history: year === 2025 ? [] : finance().history }));
    });
    const user = userEvent.setup();
    setup();
    await screen.findByText("Pix pela chave");
    await user.click(screen.getByRole("tab", { name: "2025" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/portal/financeiro?ano=2025");
    expect(await screen.findByText("Nenhum histórico neste ano")).toBeInTheDocument();
  });

  it("CA11: sem cobranças e sem histórico mostra os dois vazios", async () => {
    serve(finance({ open: [], history: [], years: [] }));
    setup();
    expect(await screen.findByText("Nenhuma cobrança em aberto")).toBeInTheDocument();
    expect(screen.getByText("Nenhum histórico neste ano")).toBeInTheDocument();
  });

  it("CA11: carregando, erro com Tentar de novo e sem permissão", async () => {
    let calls = 0;
    serve(() => (calls++ === 0 ? HttpResponse.json({ code: "X", message: "m", fields: [], traceId: "t" }, { status: 500 }) : HttpResponse.json(finance())));
    const user = userEvent.setup();
    const first = setup();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("region", { name: "Em aberto" })).toBeInTheDocument();
    first.unmount();

    serve(() => HttpResponse.json({ code: "FORBIDDEN", message: "m", fields: [], traceId: "t" }, { status: 403 }));
    setup();
    expect(await screen.findByText("Esta área não está disponível para você")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao Início" })).toHaveAttribute("href", "/");
  });

  it("CA7: portal reduzido mostra o Financeiro", async () => {
    serve(finance({ reduced: true }));
    setup();
    expect(await screen.findByRole("heading", { name: "Financeiro", level: 1 })).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Em aberto" })).toBeInTheDocument();
  });

  it("CA11: o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      serve(finance());
      const { container, unmount } = setup();
      await screen.findByRole("region", { name: "Em aberto" });
      await waitFor(async () => expect(await axeViolations(container)).toEqual([]));
      unmount();
    }
  });
});
