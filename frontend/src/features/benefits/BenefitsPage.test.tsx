import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { BenefitRow } from "./useBenefits";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "Carla Mendes" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const jiu = { id: "m1", name: "Jiu-Jitsu" };
const muay = { id: "m2", name: "Muay Thai" };
const benefit = (over: Partial<BenefitRow>): BenefitRow => ({
  id: "b1",
  student: { id: "s1", name: "Davi Nogueira" },
  unit: { id: "u1", name: "Tijuca" },
  modality: jiu,
  type: "PERCENT",
  value: 50,
  reason: "Atleta da equipe kids",
  decidedBy: "Marcos Leão",
  grantedBy: "Carla Mendes",
  validUntil: "2026-12-31",
  status: "ACTIVE",
  high: false,
  monthlyValueCents: 7500,
  planValueCents: 15000,
  nextChargeMonth: "2026-11",
  ...over,
});
const all = [
  benefit({}),
  benefit({ id: "b2", student: { id: "s2", name: "Pedro Henrique Dias" }, value: 100, high: true, reason: "Professor auxiliar", validUntil: null, monthlyValueCents: 0 }),
  benefit({ id: "b4", student: { id: "s4", name: "Marina Teixeira" }, type: "AMOUNT", value: 3000, reason: "Indicou 2 alunos", decidedBy: "Carla Mendes", validUntil: "2026-11-30", monthlyValueCents: 15000 }),
  benefit({ id: "b5", student: { id: "s5", name: "Olívia Ramos" }, modality: muay, value: 60, high: true, reason: "Campanha de retorno", validUntil: "2026-09-30", status: "EXPIRED" }),
];
const counts = { active: 14, high: 2, closed: 9 };

let calls: URLSearchParams[];

function setup(opts: { role?: string; list?: () => Response | Promise<Response>; permissions?: Record<string, string> } = {}) {
  calls = [];
  const role = opts.role ?? "COORDINATOR";
  window.history.replaceState(null, "", "/beneficios");
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: { ...mockPermissions(role), ...opts.permissions } })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Tijuca", shortName: "t" }, { id: "u2", name: "Centro", shortName: "c" }] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([{ ...jiu, active: true }, { ...muay, active: true }])),
    http.get("/api/v1/benefits", ({ request }) => {
      const q = new URL(request.url).searchParams;
      calls.push(q);
      if (opts.list) return opts.list();
      const found = all.filter((b) => (!q.get("modalityId") || b.modality.id === q.get("modalityId")) && (q.get("status") !== "CLOSED" ? b.status === "ACTIVE" : b.status !== "ACTIVE"));
      return HttpResponse.json({ items: found, page: 1, size: 25, total: found.length, counts });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/beneficios"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("BenefitsPage (RF-BEN-01)", () => {
  afterEach(() => setDeviceNarrow(false));

  it("CA1: subtítulo com a unidade escolhida (e todas as unidades), botão Conceder benefício sem ícone", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Davi Nogueira");
    expect(screen.getByText(/^Todas as unidades · no máximo um benefício ativo por modalidade/)).toBeInTheDocument();
    const grant = screen.getByRole("button", { name: "Conceder benefício" });
    expect(grant.querySelector("svg")).toBeNull();
    await user.click((await screen.findAllByRole("button", { name: /^Unidade ativa/ }))[0]);
    await user.click(screen.getByRole("button", { name: "Tijuca" }));
    expect(await screen.findByText("Unidade Tijuca · no máximo um benefício ativo por modalidade · vale a partir da próxima cobrança gerada")).toBeInTheDocument();
    await waitFor(() => expect(calls.at(-1)!.get("unitId")).toBe("u1"));
  });

  it("CA2: abas com contagem; Encerrados leva status=CLOSED e Benefícios altos leva status=ACTIVE&high=true", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Davi Nogueira");
    expect(screen.getByRole("button", { name: "Ativos, 14" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Benefícios altos, 2" })).toBeInTheDocument();
    expect(calls.at(-1)!.get("status")).toBe("ACTIVE");
    await user.click(screen.getByRole("button", { name: "Encerrados, 9" }));
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBe("CLOSED"));
    expect(await screen.findByText("Olívia Ramos")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Benefícios altos, 2" }));
    await waitFor(() => expect(calls.at(-1)!.get("high")).toBe("true"));
    expect(calls.at(-1)!.get("status")).toBe("ACTIVE");
  });

  it("CA3: pílulas Tipo e Modalidade, sem filtro de unidade, sem caixa Benefícios altos e sem placeholder Aluno; a modalidade vai na chamada", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Davi Nogueira");
    expect(screen.getByRole("button", { name: /^Tipo/ })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Unidade:/ })).toBeNull();
    expect(screen.queryByPlaceholderText("Aluno")).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Modalidade/ }));
    await user.click(await screen.findByRole("option", { name: "Muay Thai" }));
    await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBe("m2"));
    await user.click(screen.getByRole("button", { name: /^Tipo/ }));
    await user.click(await screen.findByRole("option", { name: "Desconto" }));
    await waitFor(() => expect(calls.at(-1)!.get("type")).toBe("AMOUNT"));
  });

  it("CA4: linhas com avatar, valor, Benefício alto, validade, situação e a nota de rodapé", async () => {
    setup({ list: () => HttpResponse.json({ items: all, page: 1, size: 25, total: all.length, counts }) });
    const table = within(await screen.findByRole("table"));
    const davi = within(table.getByText("Davi Nogueira").closest("tr")!);
    expect(davi.getByText("Jiu-Jitsu")).toBeInTheDocument();
    expect(davi.getByText("Bolsa")).toBeInTheDocument();
    expect(davi.getByText("50%")).toBeInTheDocument();
    expect(davi.getByText("Atleta da equipe kids")).toBeInTheDocument();
    expect(davi.getByText("Marcos Leão")).toBeInTheDocument();
    expect(davi.getByText("até 12/2026")).toBeInTheDocument();
    expect(davi.getByText("Ativa")).toBeInTheDocument();
    expect(table.getByText("DN")).toBeInTheDocument();
    const pedro = within(table.getByText("Pedro Henrique Dias").closest("tr")!);
    expect(pedro.getByText("100%")).toBeInTheDocument();
    expect(pedro.getByText("Benefício alto")).toBeInTheDocument();
    expect(pedro.getByText("sem validade")).toBeInTheDocument();
    expect(within(table.getByText("Marina Teixeira").closest("tr")!).getByText("Desconto")).toBeInTheDocument();
    expect(within(table.getByText("Marina Teixeira").closest("tr")!).getByText("R$ 30,00")).toBeInTheDocument();
    const olivia = within(table.getByText("Olívia Ramos").closest("tr")!);
    expect(olivia.getByText("venceu 30/09")).toBeInTheDocument();
    expect(olivia.getByText("Encerrado")).toBeInTheDocument();
    expect(table.queryByText("Unidade Tijuca")).toBeNull();
    expect(screen.getByText(/^Benefício acima de 50% \(ou desconto acima de metade do plano\) avisa o Coordenador/)).toBeInTheDocument();
  });

  it("CA5: Encerrar só nos ativos, com o nome no aria-label; Encerrar abre a janela, envia o motivo e recarrega", async () => {
    const user = userEvent.setup();
    const posted: unknown[] = [];
    server.use(
      http.post("/api/v1/benefits/b1/end", async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json({ ...all[0], status: "ENDED" });
      }),
    );
    setup();
    await screen.findByText("Davi Nogueira");
    expect(screen.getAllByRole("button", { name: /^Encerrar o benefício de / })).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Encerrar o benefício de Davi Nogueira" }));
    await user.type(await screen.findByLabelText(/^Motivo/), "Mudou de cidade");
    const before = calls.length;
    await user.click(screen.getByRole("button", { name: "Encerrar benefício" }));
    await waitFor(() => expect(posted).toEqual([{ reason: "Mudou de cidade" }]));
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
  });

  it("CA5: com BENEFITS = NONE a tela fica sem os botões", async () => {
    setup({ permissions: { BENEFITS: "NONE" } });
    await screen.findByText("Davi Nogueira");
    expect(screen.queryByRole("button", { name: "Conceder benefício" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Encerrar o benefício de / })).toBeNull();
  });

  it("CA6: a 390 px cartões, Conceder benefício em largura total, sem tabela", async () => {
    setDeviceNarrow(true);
    window.innerWidth = 390;
    setup();
    const card = (await screen.findByText("Davi Nogueira")).closest("li")!;
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText(/^Jiu-Jitsu/)).toBeInTheDocument();
    expect(within(card).getByText("até 12/2026")).toBeInTheDocument();
    expect(within(card).getByText("Ativa")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Encerrar o benefício de Davi Nogueira" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Conceder benefício" })).toHaveClass("w-full");
  });

  it("CA15: vazio por aba, erro com Tentar de novo, sem permissão e sem resultado", async () => {
    const user = userEvent.setup();
    let fail = true;
    const view = setup({ list: () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ items: [], page: 1, size: 25, total: 0, counts })) });
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Nenhum benefício ativo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Encerrados, 9" }));
    expect(await screen.findByText("Nenhum benefício encerrado")).toBeInTheDocument();
    view.unmount();
    setup({ list: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("R13: Professor não chega à tela", async () => {
    setup({ role: "TEACHER" });
    await waitFor(() => expect(screen.queryByText("Carregando...")).toBeNull());
    expect(screen.queryByRole("heading", { name: "Benefícios" })).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA15: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findByText("Davi Nogueira");
    expect(await axeViolations(container)).toEqual([]);
  });
});
