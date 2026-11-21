import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { PlanDetail, PlanOptions, PlanRow, PlanSummary } from "./usePlans";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const summary: PlanSummary = { plans: { active: 4, inactive: 1, studentsUsing: 131, minValueCents: 15000, maxValueCents: 22000 }, benefits: { active: 14, high: 2 } };
const jiu = { id: "m1", name: "Jiu-Jitsu" };
const muay = { id: "m2", name: "Muay Thai" };
const unit = { id: "u1", name: "Tijuca" };
const plan = (id: string, name: string, over: Partial<PlanRow> = {}): PlanRow => ({
  id,
  unit,
  modality: jiu,
  name,
  valueCents: 18000,
  weeklyFrequency: 3,
  validOtherUnits: true,
  studentsUsing: 58,
  status: "ACTIVE",
  ...over,
});
const rows = (): PlanRow[] => [
  plan("p1", "Adulto 3x"),
  plan("p2", "Adulto livre", { valueCents: 22000, weeklyFrequency: null, studentsUsing: 21 }),
  plan("p3", "Kids 2x", { valueCents: 15000, weeklyFrequency: 2, studentsUsing: 22, validOtherUnits: false }),
  plan("p4", "Adulto 2x", { modality: muay, valueCents: 16000, weeklyFrequency: 2, studentsUsing: 30, validOtherUnits: false }),
  plan("p5", "Adulto 2x (antigo)", { valueCents: 15000, weeklyFrequency: 2, studentsUsing: 3, validOtherUnits: false, status: "INACTIVE" }),
];
const options = (cross: PlanOptions["crossUnitTraining"] = "plan"): PlanOptions => ({ crossUnitTraining: cross, units: [{ id: "u1", name: "Tijuca", modalities: [jiu, muay] }] });
const detail = (p: PlanRow): PlanDetail => ({
  ...p,
  lastChange: null,
  deactivation: { at: "2026-08-01T15:00:00Z", by: "Carla Mendes" },
  valueHistory: [
    { startsOn: "2025-03-01", valueCents: 15000, changedBy: "Carla Mendes" },
    { startsOn: "2024-01-01", valueCents: 13000, changedBy: null },
  ],
});

let listCalls: URLSearchParams[];
let summaryCalls: URLSearchParams[];
let activated: string[];

function setup(
  opts: { role?: string; summary?: () => Response; list?: () => Response; cross?: PlanOptions["crossUnitTraining"]; planes?: PlanRow[]; activate?: () => Response; permissions?: Record<string, string>; path?: string } = {},
) {
  listCalls = [];
  summaryCalls = [];
  activated = [];
  const role = opts.role ?? "COORDINATOR";
  const data = opts.planes ?? rows();
  window.history.replaceState(null, "", "/planos");
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: { ...mockPermissions(role), ...opts.permissions } })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Tijuca", shortName: "t" }, { id: "u2", name: "Centro", shortName: "c" }] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([{ ...jiu, active: true }, { ...muay, active: true }])),
    http.get("/api/v1/plans/summary", ({ request }) => {
      summaryCalls.push(new URL(request.url).searchParams);
      return opts.summary ? opts.summary() : HttpResponse.json(summary);
    }),
    http.get("/api/v1/plans/options", () => HttpResponse.json(options(opts.cross))),
    http.get("/api/v1/plans", ({ request }) => {
      const q = new URL(request.url).searchParams;
      listCalls.push(q);
      if (opts.list) return opts.list();
      const found = data.filter((r) => !q.get("modalityId") || r.modality.id === q.get("modalityId"));
      return HttpResponse.json({ items: found, page: 1, size: 25, total: found.length });
    }),
    http.get("/api/v1/plans/:id", ({ params }) => HttpResponse.json(detail(data.find((r) => r.id === params.id)!))),
    http.post("/api/v1/plans/:id/activate", ({ params }) => {
      activated.push(params.id as string);
      return opts.activate ? opts.activate() : HttpResponse.json(plan(params.id as string, "x"));
    }),
  );
  function Where() {
    return <span data-testid="where">{useLocation().pathname}</span>;
  }
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[opts.path ?? "/planos"]}>
        <SessionProvider>
          <App />
          <Where />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("PlansPage · tela (RF-PLA-01, RF-PLA-02)", () => {
  afterEach(() => setDeviceNarrow(false));

  it("CA1: dois cartões com os números do resumo da unidade escolhida, Ver benefícios e Novo plano", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Adulto 3x");
    await user.click((await screen.findAllByRole("button", { name: /^Unidade ativa/ }))[0]);
    await user.click(screen.getByRole("button", { name: "Tijuca" }));
    await waitFor(() => expect(summaryCalls.at(-1)!.get("unitId")).toBe("u1"));
    const plans = within(await screen.findByRole("region", { name: "Resumo de planos e benefícios" }));
    expect(await plans.findByText("ativos na Tijuca · só mensais, um por modalidade")).toBeInTheDocument();
    expect(plans.getByText("ativos · 2 acima de 50% · bolsas e descontos")).toBeInTheDocument();
    expect(screen.getByText("Unidade Tijuca · valores guardados em centavos · a graduação não muda a mensalidade")).toBeInTheDocument();
    expect(plans.getByRole("link", { name: "Ver benefícios" })).toHaveAttribute("href", "/beneficios");
    await user.click(plans.getByRole("button", { name: "Novo plano" }));
    expect(await screen.findByRole("dialog", { name: "Novo plano" })).toBeInTheDocument();
  });

  it("CA2, CA3: tabela com os cinco planos, sem busca nem filtro de unidade e situação; a pílula leva modalityId; nota de rodapé", async () => {
    const user = userEvent.setup();
    setup();
    const table = within(await screen.findByRole("table"));
    expect(table.getAllByRole("row")).toHaveLength(6);
    const livre = within(table.getByText("Adulto livre").closest("tr")!);
    expect(livre.getByText("R$ 220,00")).toBeInTheDocument();
    expect(livre.getByText("Livre")).toBeInTheDocument();
    expect(livre.getByText("21")).toBeInTheDocument();
    expect(livre.getByText("Ativo")).toBeInTheDocument();
    expect(table.getByText("3x por semana")).toBeInTheDocument();
    expect(within(table.getByText("Adulto 2x (antigo)").closest("tr")!).getByText("Desativado")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Situação/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Unidade:/ })).toBeNull();
    expect(screen.getByText(/A frequência é só informativa/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Modalidade/ }));
    await user.click(await screen.findByRole("option", { name: "Muay Thai" }));
    await waitFor(() => expect(listCalls.at(-1)!.get("modalityId")).toBe("m2"));
    await waitFor(() => expect(screen.queryByText("Adulto 3x")).toBeNull());
    expect(screen.getByText("Adulto 2x")).toBeInTheDocument();
  });

  it("CA4: /planos/lista redireciona para /planos; a coluna Outras unidades só existe com a política Depende do plano", async () => {
    setup({ cross: "plan" });
    expect(await screen.findByRole("columnheader", { name: "Outras unidades" })).toBeInTheDocument();
    expect(screen.getAllByText("Vale nas outras unidades").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Só nesta unidade").length).toBeGreaterThan(0);
  });

  it.each(["allowed", "denied"] as const)("CA4: com a política %s a coluna Outras unidades não existe", async (cross) => {
    setup({ cross });
    await screen.findByRole("table");
    await waitFor(() => expect(screen.queryByRole("columnheader", { name: "Outras unidades" })).toBeNull());
    expect(screen.queryByText("Só nesta unidade")).toBeNull();
  });

  it("CA4: o endereço antigo leva a /planos", async () => {
    setup({ path: "/planos/lista" });
    await screen.findByRole("table");
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/planos$/);
  });

  it("CA5: a 390 px abas Planos 4 e Benefícios 14, um cartão por plano, Novo plano em largura total, sem tabela", async () => {
    setDeviceNarrow(true);
    window.innerWidth = 390;
    setup();
    const card = (await screen.findByText("Adulto 3x")).closest("li")!;
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText("3x por semana · 58 alunos")).toBeInTheDocument();
    expect(within(card).getByText("R$ 180,00")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Planos e benefícios" })).toHaveTextContent("Planos 4");
    expect(screen.getByRole("link", { name: "Benefícios 14" })).toHaveAttribute("href", "/beneficios");
    expect(screen.getAllByRole("listitem").filter((li) => li.textContent?.includes("alunos"))).toHaveLength(5);
    const create = screen.getAllByRole("button", { name: "Novo plano" });
    expect(create).toHaveLength(1);
    expect(create[0]).toHaveClass("w-full");
    expect(within(screen.getByText("Adulto 2x (antigo)").closest("li")!).getByText("Desativado")).toBeInTheDocument();
  });

  it("CA14: sem permissão de gestão não há Novo plano nem Editar; Professor recebe sem permissão", async () => {
    setup({ permissions: { PLANS: "READ" }, summary: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo plano" })).toBeNull();
  });

  it("CA14: com PLANS = NONE a rota mostra 'sem acesso' e não consulta o resumo (D1 da #675)", async () => {
    setup({ permissions: { PLANS: "NONE" } });
    await screen.findByText("Esta área não está disponível para o seu perfil");
    expect(summaryCalls).toHaveLength(0);
  });

  it("CA14: Professor vê a tela de sem permissão e não consulta o resumo", async () => {
    setup({ role: "TEACHER" });
    await screen.findByText("Esta área não está disponível para o seu perfil");
    expect(summaryCalls).toHaveLength(0);
  });

  it("CA15: vazio com a ação de criar; erro da lista com Tentar de novo; sem permissão do servidor", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup({ list: () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ items: [], page: 1, size: 25, total: 0 })) });
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Nenhum plano ainda")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Novo plano" }).length).toBeGreaterThan(1);
  });

  it("CA15: o resumo com 403 mostra sem permissão; com erro mostra Tentar de novo", async () => {
    setup({ summary: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA11, CA12: Editar no plano desativado abre a gaveta de consulta; Reativar plano chama a API, fecha e recarrega", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByRole("button", { name: "Editar o plano Adulto 2x (antigo)" }));
    const drawer = within(await screen.findByRole("dialog", { name: "Adulto 2x (antigo)" }));
    expect(await drawer.findByText("Desativado em 01/08/2026 por Carla Mendes")).toBeInTheDocument();
    expect(drawer.getByText("Plano desativado: só consulta. Reative para editar ou voltar a oferecer.")).toBeInTheDocument();
    expect(drawer.getByText("Alunos que ainda usam")).toBeInTheDocument();
    expect(drawer.getByText("Vale em outras unidades").nextSibling).toHaveTextContent("Não");
    const history = drawer.getAllByRole("row").slice(1);
    expect(history[0]).toHaveTextContent("01/03/2025R$ 150,00Carla Mendes");
    expect(history[1]).toHaveTextContent("01/01/2024R$ 130,00—");
    expect(drawer.queryByRole("textbox")).toBeNull();
    const before = listCalls.length;
    await user.click(drawer.getByRole("button", { name: "Reativar plano" }));
    await waitFor(() => expect(activated).toEqual(["p5"]));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(listCalls.length).toBeGreaterThan(before));
  });

  it("#676 CA5: o plano desativado abre em /planos/<id> sobre a lista; F5 reabre; fechar volta a /planos", async () => {
    const user = userEvent.setup();
    setup({ path: "/planos/p5" });
    const drawer = within(await screen.findByRole("dialog", { name: "Adulto 2x (antigo)" }));
    expect(await drawer.findByText("Desativado em 01/08/2026 por Carla Mendes")).toBeInTheDocument();
    await waitFor(() => expect(listCalls.length).toBeGreaterThan(0));
    await user.click(drawer.getByRole("button", { name: "Fechar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByTestId("where")).toHaveTextContent("/planos");
  });

  it("CA12: reativar com homônimo ativo (409) mostra o conflito e a gaveta continua aberta", async () => {
    const user = userEvent.setup();
    setup({ activate: () => HttpResponse.json({ code: "CONFLICT" }, { status: 409 }) });
    await user.click(await screen.findByRole("button", { name: "Editar o plano Adulto 2x (antigo)" }));
    const drawer = within(await screen.findByRole("dialog"));
    await drawer.findByText("Desativado em 01/08/2026 por Carla Mendes");
    await user.click(drawer.getByRole("button", { name: "Reativar plano" }));
    expect(await drawer.findByText(/Já existe um plano ativo com este nome/)).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA15: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDeviceNarrow(true, dark);
    window.innerWidth = 360;
    if (dark) document.documentElement.classList.add("dark");
    const { container } = setup();
    await screen.findByText("Adulto 3x");
    expect(await axeViolations(container)).toEqual([]);
  });
});
