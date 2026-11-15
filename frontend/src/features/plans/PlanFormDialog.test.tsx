import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { PlanDetail, PlanOptions, PlanRow } from "./usePlans";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const options = (cross: PlanOptions["crossUnitTraining"] = "plan"): PlanOptions => ({
  crossUnitTraining: cross,
  units: [
    { id: "u1", name: "Centro", modalities: [{ id: "m1", name: "Jiu-Jitsu" }, { id: "m2", name: "Judô" }] },
    { id: "u2", name: "Norte", modalities: [{ id: "m2", name: "Judô" }] },
  ],
});
const plan = (over: Partial<PlanRow> = {}): PlanRow => ({
  id: "p1",
  unit: { id: "u1", name: "Centro" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  name: "Mensal 2x",
  valueCents: 15000,
  weeklyFrequency: 2,
  validOtherUnits: false,
  studentsUsing: 58,
  status: "ACTIVE",
  ...over,
});

let sent: { method: string; url: string; body?: Record<string, unknown> }[];
let rows: PlanRow[];
let listCalls: number;
let impactCalls: string[];
let impact = { studentsAffected: 58, unpaidCharges: 6, paidFutureCharges: 2 };
let lastChange: PlanDetail["lastChange"] = { at: "2026-09-12T17:30:00Z", by: "Marcos Leão" };

function setup(opts: { cross?: PlanOptions["crossUnitTraining"]; optionsResponse?: () => Response | Promise<Response>; post?: () => Response } = {}) {
  sent = [];
  impactCalls = [];
  listCalls = 0;
  rows = [plan()];
  window.history.replaceState(null, "", "/planos");
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session("COORDINATOR"))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions("COORDINATOR") })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([])),
    http.get("/api/v1/plans/summary", () => HttpResponse.json({ plans: { active: 1, inactive: 0, studentsUsing: 58, minValueCents: 15000, maxValueCents: 15000 }, benefits: { active: 0, high: 0 } })),
    http.get("/api/v1/plans", () => {
      listCalls += 1;
      return HttpResponse.json({ items: rows, page: 1, size: 25, total: rows.length });
    }),
    http.get("/api/v1/plans/options", () => (opts.optionsResponse ? opts.optionsResponse() : HttpResponse.json(options(opts.cross)))),
    http.get("/api/v1/plans/p1", () => HttpResponse.json({ ...plan(), lastChange, deactivation: null, valueHistory: [] })),
    http.get("/api/v1/plans/p1/value-impact", ({ request }) => {
      impactCalls.push(new URL(request.url).searchParams.get("valueCents")!);
      return HttpResponse.json({ effectiveFrom: "NEXT_CHARGE", ...impact });
    }),
    http.post("/api/v1/plans", async ({ request }) => {
      sent.push({ method: "POST", url: "/plans", body: (await request.json()) as Record<string, unknown> });
      if (opts.post) return opts.post();
      return HttpResponse.json(plan({ id: "n1", name: "Novo" }), { status: 201 });
    }),
    http.put("/api/v1/plans/p1", async ({ request }) => {
      sent.push({ method: "PUT", url: "/plans/p1", body: (await request.json()) as Record<string, unknown> });
      return HttpResponse.json(plan());
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/planos"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const dialog = () => screen.findByRole("dialog");
const openEdit = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("button", { name: "Editar o plano Mensal 2x" }));
  return within(await dialog());
};

beforeEach(() => {
  impact = { studentsAffected: 58, unpaidCharges: 6, paidFutureCharges: 2 };
  lastChange = { at: "2026-09-12T17:30:00Z", by: "Marcos Leão" };
});

describe("PlanFormDialog · novo plano (R7)", () => {
  afterEach(() => setDeviceNarrow(false));

  it("CA6, CA9: abre com Unidade e Modalidade escolhíveis, sem Valor atual nem Última alteração; erros no campo sem chamar a API; salvar envia centavos, fecha e recarrega", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Mensal 2x");
    await user.click((await screen.findAllByRole("button", { name: "Novo plano" }))[0]);
    const d = within(await dialog());
    const modality = await d.findByLabelText(/^Modalidade/);
    expect(d.queryByLabelText("Valor atual")).toBeNull();
    expect(d.queryByText(/Última alteração|Ainda sem alterações/)).toBeNull();
    await user.selectOptions(d.getByLabelText(/^Unidade/), "u2");
    expect(within(modality).getAllByRole("option").map((o) => o.textContent)).toEqual(["Escolha", "Judô"]);
    await user.selectOptions(d.getByLabelText(/^Unidade/), "u1");
    await user.type(d.getByLabelText(/^Nome/), "A");
    await user.click(d.getByRole("button", { name: "Criar plano" }));
    expect(await d.findByText("Escolha a modalidade.")).toBeInTheDocument();
    expect(d.getByText("Informe um nome de 2 a 60 caracteres.")).toBeInTheDocument();
    expect(d.getByText("Informe um valor de R$ 0,01 a R$ 999.999,99.")).toBeInTheDocument();
    expect(sent).toEqual([]);

    await user.selectOptions(modality, "m2");
    await user.type(d.getByLabelText(/^Nome/), "bc");
    await user.type(d.getByLabelText(/^Valor mensal/), "123450");
    await user.selectOptions(d.getByLabelText("Frequência"), "3");
    await user.click(d.getByRole("switch", { name: "Vale também nas outras unidades" }));
    const before = listCalls;
    await user.click(d.getByRole("button", { name: "Criar plano" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(sent).toEqual([{ method: "POST", url: "/plans", body: { name: "Abc", valueCents: 123450, weeklyFrequency: 3, validOtherUnits: true, unitId: "u1", modalityId: "m2" } }]);
    await waitFor(() => expect(listCalls).toBeGreaterThan(before));
  });

  it("CA9: 400 do servidor mostra o erro no campo e a janela continua aberta", async () => {
    const user = userEvent.setup();
    setup({ post: () => HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "name", message: "de 2 a 60 caracteres" }] }, { status: 400 }) });
    await screen.findByText("Mensal 2x");
    await user.click((await screen.findAllByRole("button", { name: "Novo plano" }))[0]);
    const d = within(await dialog());
    await user.selectOptions(await d.findByLabelText(/^Unidade/), "u1");
    await user.selectOptions(d.getByLabelText(/^Modalidade/), "m1");
    await user.type(d.getByLabelText(/^Nome/), "Plano");
    await user.type(d.getByLabelText(/^Valor mensal/), "10000");
    await user.click(d.getByRole("button", { name: "Criar plano" }));
    const field = await d.findByText("de 2 a 60 caracteres");
    expect(d.getByLabelText(/^Nome/)).toHaveAccessibleDescription(field.textContent!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("CA9: 409 de nome repetido mostra a mensagem no alto da janela e ela não fecha", async () => {
    const user = userEvent.setup();
    setup({ post: () => HttpResponse.json({ code: "CONFLICT" }, { status: 409 }) });
    await screen.findByText("Mensal 2x");
    await user.click((await screen.findAllByRole("button", { name: "Novo plano" }))[0]);
    const d = within(await dialog());
    await user.selectOptions(await d.findByLabelText(/^Unidade/), "u1");
    await user.selectOptions(d.getByLabelText(/^Modalidade/), "m1");
    await user.type(d.getByLabelText(/^Nome/), "Plano");
    await user.type(d.getByLabelText(/^Valor mensal/), "10000");
    await user.click(d.getByRole("button", { name: "Criar plano" }));
    expect(await d.findByRole("alert")).toHaveTextContent("Já existe um plano ativo com este nome");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("PlanFormDialog · editar (R5, R6)", () => {
  it("CA6, CA7: campos preenchidos, Valor atual desabilitado, Última alteração e Salvar plano; sem mudança de valor não há aviso nem escolhas", async () => {
    const user = userEvent.setup();
    setup();
    const d = await openEdit(user);
    expect(await d.findByLabelText(/^Nome/)).toHaveValue("Mensal 2x");
    expect(d.getByLabelText("Valor atual")).toBeDisabled();
    expect(d.getByLabelText("Valor atual")).toHaveValue("R$ 150,00");
    expect(d.getByLabelText(/^Novo valor/)).toHaveValue("R$ 150,00");
    expect(d.getByLabelText("Frequência")).toHaveValue("2");
    expect(d.queryByLabelText(/^Unidade/)).toBeNull();
    expect(d.getByLabelText("Modalidade")).toHaveValue("Jiu-Jitsu");
    expect(d.getByLabelText("Modalidade")).toBeDisabled();
    expect(d.getByText("Unidade: Centro")).toBeInTheDocument();
    expect(await d.findByText(/Última alteração em 12\/09\/2026 .* por Marcos Leão/)).toBeInTheDocument();
    expect(d.getByRole("switch", { name: "Vale também nas outras unidades" })).toBeInTheDocument();
    expect(d.getByText('A organização usa "Depende do plano" para treinar em outra unidade')).toBeInTheDocument();
    expect(d.queryByText(/serão afetados/)).toBeNull();
    await user.clear(d.getByLabelText(/^Nome/));
    await user.type(d.getByLabelText(/^Nome/), "Mensal 3x");
    await user.click(d.getByRole("button", { name: "Salvar plano" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(sent).toEqual([{ method: "PUT", url: "/plans/p1", body: { name: "Mensal 3x", valueCents: 15000, weeklyFrequency: 2, validOtherUnits: false } }]);
    expect(impactCalls).toEqual([]);
  });

  it("CA7: sem alteração anterior mostra Ainda sem alterações", async () => {
    const user = userEvent.setup();
    lastChange = null;
    setup();
    expect(await (await openEdit(user)).findByText("Ainda sem alterações")).toBeInTheDocument();
  });

  it("CA8: valor novo mostra o aviso com os alunos e os dois grupos de escolha com contadores e padrões; as escolhas vão no PUT", async () => {
    const user = userEvent.setup();
    setup();
    const d = await openEdit(user);
    const value = await d.findByLabelText(/^Novo valor/);
    await user.clear(value);
    await user.type(value, "18000");
    expect(await d.findByText("58 alunos serão afetados a partir da próxima cobrança gerada. Eles recebem um e-mail com o valor novo.")).toBeInTheDocument();
    expect(impactCalls.at(-1)).toBe("18000");
    const unpaid = within(d.getByRole("group", { name: "Cobranças já geradas e não pagas (6)" }));
    expect(unpaid.getByRole("radio", { name: /Manter no valor antigo \(padrão\)/ })).toBeChecked();
    const paid = within(d.getByRole("group", { name: "Cobranças de meses futuros já pagas (2)" }));
    expect(paid.getByRole("radio", { name: /Não cobrar a diferença \(padrão\)/ })).toBeChecked();
    expect(paid.getByText("O aluno é avisado")).toBeInTheDocument();
    expect(d.getByText("Cobrança paga nunca muda. A escolha vai para a auditoria.")).toBeInTheDocument();
    await user.click(unpaid.getByRole("radio", { name: /Ajustar para o valor novo/ }));
    await user.click(paid.getByRole("radio", { name: /Cobrar "Diferença de reajuste"/ }));
    await user.click(d.getByRole("button", { name: "Salvar plano" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(sent[0].body).toMatchObject({ valueCents: 18000, unpaidCharges: "ADJUST", paidFutureDifference: true });
  });

  it("CA8: sem escolha envia KEEP e false; sem cobranças afetadas os grupos não aparecem; um aluno vai ao singular", async () => {
    const user = userEvent.setup();
    impact = { studentsAffected: 1, unpaidCharges: 0, paidFutureCharges: 0 };
    setup();
    const d = await openEdit(user);
    const value = await d.findByLabelText(/^Novo valor/);
    await user.clear(value);
    await user.type(value, "18000");
    expect(await d.findByText(/^1 aluno será afetado/)).toBeInTheDocument();
    expect(d.queryByRole("group")).toBeNull();
    await user.click(d.getByRole("button", { name: "Salvar plano" }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0].body).toMatchObject({ valueCents: 18000, unpaidCharges: "KEEP", paidFutureDifference: false });
  });

  it("CA7: com allowed ou denied não há interruptor e a nota da política aparece", async () => {
    const user = userEvent.setup();
    const view = setup({ cross: "allowed" });
    const d = await openEdit(user);
    expect(await d.findByText(/permite treinar em outra unidade em todos os planos/)).toBeInTheDocument();
    expect(d.queryByRole("switch")).toBeNull();
    view.unmount();
    setup({ cross: "denied" });
    expect(await (await openEdit(user)).findByText(/não permite treinar em outra unidade em nenhum plano/)).toBeInTheDocument();
  });

  it("CA10: Desativar plano no rodapé abre a confirmação e a janela de edição fecha", async () => {
    const user = userEvent.setup();
    setup();
    const d = await openEdit(user);
    await user.click(await d.findByRole("button", { name: "Desativar plano" }));
    const c = within(await screen.findByRole("dialog", { name: "Desativar plano" }));
    expect(c.getByText("Jiu-Jitsu · Mensal 2x · R$ 150,00")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Editar plano" })).toBeNull();
  });

  it("CA15: carregando, erro com Tentar de novo e sem permissão nas opções", async () => {
    const user = userEvent.setup();
    let fail = true;
    let release: () => void = () => undefined;
    const gate = new Promise<void>((r) => (release = r));
    setup({ optionsResponse: async () => (fail ? (await gate, HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })) : HttpResponse.json(options())) });
    await screen.findByText("Mensal 2x");
    await user.click((await screen.findAllByRole("button", { name: "Novo plano" }))[0]);
    expect(within(await dialog()).getByText("Carregando...")).toBeInTheDocument();
    release();
    const retry = await within(screen.getByRole("dialog")).findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await within(screen.getByRole("dialog")).findByLabelText(/^Nome/)).toBeInTheDocument();
  });

  it("CA15: 403 nas opções mostra o estado de sem permissão", async () => {
    const user = userEvent.setup();
    setup({ optionsResponse: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    await screen.findByText("Mensal 2x");
    await user.click((await screen.findAllByRole("button", { name: "Novo plano" }))[0]);
    expect(await within(await dialog()).findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([false, true])("CA15: a 360 px, com a edição e o aviso de reajuste abertos, não há violações no axe (escuro: %s)", async (dark) => {
    const user = userEvent.setup();
    setDeviceNarrow(true, dark);
    window.innerWidth = 360;
    if (dark) document.documentElement.classList.add("dark");
    const { baseElement } = setup();
    const d = await openEdit(user);
    const value = await d.findByLabelText(/^Novo valor/);
    await user.clear(value);
    await user.type(value, "20000");
    await d.findByText(/serão afetados/);
    expect(await axeViolations(baseElement)).toEqual([]);
    setDeviceNarrow(false);
  });
});
