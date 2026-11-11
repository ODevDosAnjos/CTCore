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
import { requestDeadline } from "./RequestSummary";
import type { PortalRequest } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
// Data do dia daqui a n dias (fuso da unidade), igual à que a tela usa para contar o prazo.
const DAYS = (n: number) => new Date(Date.parse(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()) + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
const request = (over: Partial<PortalRequest>): PortalRequest => ({
  id: "r1",
  kind: "CLASS_CHANGE",
  status: "OPEN",
  studentId: "s1",
  studentName: "Aluno Adulto Fictício",
  unitId: "u1",
  unit: "Centro",
  modalityRowId: "m1",
  modality: "Judô",
  targetClassId: "k2",
  targetClass: "Judô Noite",
  targetPlanId: null,
  targetPlan: null,
  targetModalityId: null,
  targetUnitId: null,
  targetUnit: null,
  reason: null,
  note: "Troco por causa do trabalho",
  response: null,
  createdAt: "2026-10-20T15:00:00Z",
  decidedAt: null,
  expiresAt: DAYS(29),
  currentClass: "Judô Manhã",
  currentPlan: "Judô 2x",
  ...over,
});
const all = [
  request({}),
  request({ id: "r2", kind: "CLOSURE", targetClassId: null, targetClass: null, reason: "SCHEDULE", note: null, studentName: "Aluno Menor Fictício", studentId: "s2", expiresAt: DAYS(7) }),
];
const counts = { total: 4, CLASS_CHANGE: 1, NEW_MODALITY: 1, PLAN_CHANGE: 1, CLOSURE: 1 };

let calls: URLSearchParams[];
let decisions: { url: string; body: unknown }[];

function setup(role = "COORDINATOR", list?: () => Response | Promise<Response>) {
  calls = [];
  decisions = [];
  window.history.replaceState(null, "", "/pedidos");
  const decide =
    (status: string) =>
    async ({ request: req, params }: { request: Request; params: Record<string, unknown> }) => {
      const body = await req.json().catch(() => ({}));
      decisions.push({ url: req.url, body });
      return HttpResponse.json({ ...all.find((r) => r.id === params.id)!, status, response: (body as { message?: string }).message ?? null });
    };
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }] })),
    http.get("/api/v1/portal-requests", ({ request: req }) => {
      calls.push(new URL(req.url).searchParams);
      return list ? list() : HttpResponse.json({ items: all, page: 1, size: 25, total: all.length, counts });
    }),
    http.post("/api/v1/portal-requests/:id/approve", decide("APPROVED")),
    http.post("/api/v1/portal-requests/:id/refuse", decide("REFUSED")),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/pedidos"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Pedidos", level: 1 });

describe("PortalRequestsPage (RF-MAT-04)", () => {
  it("CA1, CA3, CA4, CA5: cabeçalho, abas, colunas, detalhe, prazo e ações", async () => {
    setup();
    await ready();
    expect(screen.getByText("Tudo que chegou pelo portal e pelo link de matrícula, para você decidir")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Pedidos" });
    await waitFor(() => expect(within(nav).getByText("Pedidos do portal").closest("[aria-current]")).toHaveTextContent("4"));
    const soon = within(nav).getByText("Aguardando aprovação");
    expect(soon).toHaveAttribute("aria-disabled", "true");
    expect(within(nav).getByText("Em breve")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Aluno", "Pedido", "Detalhe", "Recebido em", "Prazo", "Ações"]);
    const row = (await screen.findAllByText("Aluno Adulto Fictício"))[0].closest("tr")!;
    expect(within(row).getByText("AF")).toBeInTheDocument();
    expect(within(row).getByText("Centro")).toBeInTheDocument();
    expect(within(row).getByText("Troca de turma")).toBeInTheDocument();
    expect(within(row).getByText("Judô: Judô Manhã → Judô Noite")).toBeInTheDocument();
    expect(within(row).getByText("20/10/2026")).toBeInTheDocument();
    expect(within(row).getByText("expira em 29 dias")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "Aluno Adulto Fictício" })).toHaveAttribute("href", "/alunos/s1");
    expect(within(row).getByRole("button", { name: "Aprovar pedido de Aluno Adulto Fictício" })).toBeInTheDocument();
    const closure = screen.getAllByText("Aluno Menor Fictício")[0].closest("tr")!;
    expect(within(closure).getByText(/^Judô · motivo: horário · encerra sozinho em \d\d\/\d\d se ninguém agir$/)).toBeInTheDocument();
    expect(within(closure).getByText("faltam 6 dias")).toBeInTheDocument();
    expect(within(closure).queryByRole("button", { name: /^Aprovar/ })).toBeNull();
    expect(within(closure).getByRole("link", { name: "Ver ficha de Aluno Menor Fictício" })).toHaveAttribute("href", "/alunos/s2");
    expect(screen.getByText("Pedidos sem resposta expiram em 30 dias e o aluno é avisado. Ao recusar, você escreve a mensagem que o aluno vai ver.")).toBeInTheDocument();
    expect(calls.at(-1)!.get("status")).toBeNull();
    expect(screen.queryByLabelText("Situação")).toBeNull();
  });

  it("CA4: prazo no último dia vira expira hoje, no encerramento e nos demais", () => {
    const t = (k: string, o?: Record<string, unknown>) => `${k}${o ? JSON.stringify(o) : ""}`;
    expect(requestDeadline(t, request({ expiresAt: DAYS(0) }))).toBe("portalRequests.deadline.today");
    expect(requestDeadline(t, request({ kind: "CLOSURE", expiresAt: DAYS(1) }))).toBe("portalRequests.deadline.today");
    expect(requestDeadline(t, request({ kind: "CLOSURE", expiresAt: DAYS(7) }))).toBe('portalRequests.deadline.left{"count":6}');
    expect(requestDeadline(t, request({ expiresAt: DAYS(29) }))).toBe('portalRequests.deadline.expires{"count":29}');
  });

  it("CA2: pílulas com contagem filtram por tipo sem mudar as contagens; unidade refaz; sem filtro de situação", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findAllByText("Aluno Adulto Fictício");
    const pills = ["Todos, 4", "Troca de turma, 1", "Nova modalidade, 1", "Troca de plano, 1", "Encerramento, 1"];
    for (const name of pills) expect(screen.getByRole("button", { name })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Encerramento, 1" }));
    await waitFor(() => expect(calls.at(-1)!.get("kind")).toBe("CLOSURE"));
    expect(screen.getByRole("button", { name: "Todos, 4" })).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /^Unidade/ }));
    await user.click(await screen.findByRole("option", { name: "Centro" }));
    await waitFor(() => expect(calls.at(-1)!.get("unitId")).toBe("u1"));
  });

  it("CA19: Recusar abre a janela, exige mensagem de 3 caracteres e some o pedido da lista aberta", async () => {
    const user = userEvent.setup();
    setup();
    await user.click((await screen.findAllByRole("button", { name: "Recusar pedido de Aluno Adulto Fictício" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "Recusar pedido" });
    const submit = within(dialog).getByRole("button", { name: "Recusar pedido" });
    expect(submit).toBeEnabled();
    await user.clear(within(dialog).getByLabelText(/^Mensagem para a Aluno/));
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/^Mensagem para a Aluno/), "ab");
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/^Mensagem para a Aluno/), "c");
    server.use(http.get("/api/v1/portal-requests", () => HttpResponse.json({ items: [all[1]], page: 1, size: 25, total: 1 })));
    await user.click(submit);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(decisions).toEqual([{ url: expect.stringContaining("/portal-requests/r1/refuse"), body: { message: "abc" } }]);
    await waitFor(() => expect(screen.queryByText("Troco por causa do trabalho")).toBeNull());
  });

  it("CA6: a janela traz resumo, texto sugerido e contador; o encerramento tem título, subtítulo e botões próprios", async () => {
    const user = userEvent.setup();
    setup();
    await user.click((await screen.findAllByRole("button", { name: "Recusar pedido de Aluno Adulto Fictício" }))[0]);
    let dialog = await screen.findByRole("dialog", { name: "Recusar pedido" });
    expect(within(dialog).getByText("Resumo")).toBeInTheDocument();
    expect(within(dialog).getByText("O pedido fica Recusado.")).toBeInTheDocument();
    expect((within(dialog).getByLabelText(/^Mensagem para a Aluno/) as HTMLTextAreaElement).value).toMatch(/^Olá, Aluno! /);
    expect(within(dialog).getByText(/^\d+\/500$/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getAllByRole("button", { name: "Recusar pedido de Aluno Menor Fictício" })[0]);
    dialog = await screen.findByRole("dialog", { name: "Recusar encerramento" });
    expect(within(dialog).getByText(/^Aluno Menor Fictício · Judô · pedido de \d\d\/\d\d · encerra sozinho em \d\d\/\d\d$/)).toBeInTheDocument();
    expect(within(dialog).getByText("Judô volta a ficar Ativa.")).toBeInTheDocument();
    expect(within(dialog).getByText("Aluno recebe a sua mensagem por e-mail e no portal.")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("button", { name: "Voltar" }).at(-1)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Recusar e enviar mensagem" })).toBeEnabled();
  });

  it("CA7: Aprovar não abre janela, chama approve sem corpo e leva à ficha do aluno", async () => {
    const user = userEvent.setup();
    setup();
    await user.click((await screen.findAllByRole("button", { name: "Aprovar pedido de Aluno Adulto Fictício" }))[0]);
    await waitFor(() => expect(decisions).toEqual([{ url: expect.stringContaining("/portal-requests/r1/approve"), body: {} }]));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Pedidos", level: 1 })).toBeNull());
  });

  it("CA19: vazio, erro com nova tentativa e sem permissão", async () => {
    const user = userEvent.setup();
    let fail = true;
    const view = setup("COORDINATOR", () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ items: [], page: 1, size: 25, total: 0 })));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Nenhum pedido")).toBeInTheDocument();
    view.unmount();
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA19: o item Pedidos aparece no menu Pessoas", async () => {
    setup("ADMINISTRATOR");
    await ready();
    expect(screen.getAllByRole("link", { name: "Pedidos" })[0]).toHaveAttribute("href", "/pedidos");
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA19: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findAllByText("Aluno Adulto Fictício");
    expect(await axeViolations(container)).toEqual([]);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA10: a janela de recusa não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup();
    await userEvent.setup().click((await screen.findAllByRole("button", { name: "Recusar pedido de Aluno Adulto Fictício" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: "Recusar pedido" });
    expect(await axeViolations(dialog)).toEqual([]);
  });
});
