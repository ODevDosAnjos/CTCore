import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { enrollmentOf, modalityRow } from "@/features/students/enrollmentFixtures";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { gate } from "@/test/gate";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { GenerationPreview, PreviewLine } from "./types";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "COORDINATOR", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const line = (n: number, over: Partial<PreviewLine> = {}): PreviewLine => ({
  studentId: `s${n}`,
  student: `Aluno ${n}`,
  modalityRowId: `r${n}`,
  modality: "Jiu-Jitsu",
  plan: "Mensal",
  discountCents: 0,
  amountCents: 10000,
  referenceMonth: "2099-12-01",
  adjustable: true,
  ...over,
});
const gen = (dueOn: string) => new Date(Date.parse(`${dueOn}T12:00:00Z`) - 10 * 86_400_000).toISOString().slice(0, 10);
const day = (dueOn: string, lines: PreviewLine[], previousTotalCents = 0) => ({ dueOn, generatesOn: gen(dueOn), count: lines.length, totalCents: lines.reduce((t, l) => t + l.amountCents, 0), previousTotalCents, lines });
const data = (over: Partial<GenerationPreview> = {}): GenerationPreview => ({
  until: "2099-12-31",
  days: [day("2099-12-05", [line(1), line(2, { discountCents: 2000, amountCents: 8000 })], 18000), day("2099-12-10", [line(3)], 5000), day("2099-12-15", [line(4), line(5, { adjustable: false })], 20000)],
  count: 5,
  totalCents: 48000,
  previousMonthTotalCents: 33000,
  alreadyGeneratedCents: 12500,
  skipped: [{ studentId: "s9", student: "Bia Bolsista", modality: "Judô", referenceMonth: "2099-12-01", reason: "FULL_BENEFIT" }],
  ...over,
});

let calls: URLSearchParams[];
let writes: { method: string; url: string; body: unknown }[];

function setup(opts: { role?: string; preview?: () => Response | Promise<Response>; level?: "FULL" | "READ"; units?: { id: string; name: string; shortName: string }[]; allUnits?: boolean } = {}) {
  calls = [];
  writes = [];
  const role = opts.role ?? "COORDINATOR";
  window.history.replaceState(null, "", "/cobrancas/previa");
  const perms = { ...mockPermissions(role), COLLECTIONS: opts.level ?? "FULL" };
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: perms })),
    http.get("/api/v1/units/reachable", () =>
      HttpResponse.json({ allUnits: opts.allUnits ?? false, units: opts.units ?? [{ id: "u1", name: "Centro", shortName: "c" }] }),
    ),
    http.get("/api/v1/billing/generation-preview", ({ request }) => {
      calls.push(new URL(request.url).searchParams);
      return opts.preview ? opts.preview() : HttpResponse.json(data());
    }),
    http.patch("/api/v1/students/:id/modalities/:row/next-charge", async ({ request }) => {
      writes.push({ method: "PATCH", url: request.url, body: await request.json() });
      return HttpResponse.json({ dueOn: "2099-12-20", referenceMonth: "2099-12-01" });
    }),
    http.post("/api/v1/students/:id/modalities/:row/next-charge/cancel", async ({ request }) => {
      writes.push({ method: "POST", url: request.url, body: await request.json() });
      return HttpResponse.json({ chargeId: "c1", referenceMonth: "2099-12-01" });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/cobrancas/previa"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Prévia da geração", level: 1 });
// "Ver alunos" abre as linhas do dia (D9); as ações vivem nelas.
const openAll = async (user: ReturnType<typeof userEvent.setup>) => {
  for (const b of await screen.findAllByRole("button", { name: /^Ver alunos do dia/ })) await user.click(b);
};

describe("ChargePreviewPage (RF-COB-03)", () => {
  afterEach(() => setDeviceNarrow(false));

  it("CA8: subtítulo com mês, unidade e a regra da geração; botão no topo; período com 30 dias marcado; sem Voltar", async () => {
    setup();
    await ready();
    await screen.findByText("Total previsto");
    expect(screen.getByText(/a geração é automática, todo dia, 10 dias antes de cada vencimento/)).toHaveTextContent("Dezembro/2099 · Centro · a geração é automática");
    expect(screen.getByRole("button", { name: "Gerar próximas mensalidades" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Período" })).toHaveValue("30");
    expect(screen.queryByRole("link", { name: "Voltar às cobranças" })).toBeNull();
    expect(calls.at(-1)!.get("unitId")).toBe("u1");
    expect(calls.at(-1)!.get("days")).toBe("30");
  });

  it("CA9: três cartões com total e diferença para o mês anterior, quantidade com pulados e já gerado", async () => {
    setup();
    await ready();
    await screen.findByText("Total previsto");
    expect(screen.getByText("Total previsto").nextElementSibling).toHaveTextContent(/480,00/);
    expect(screen.getByText(/em relação a novembro/)).toHaveTextContent(/^\+\s.*150,00 em relação a novembro$/);
    expect(screen.getByText("Mensalidades", { selector: "p" }).nextElementSibling).toHaveTextContent("5");
    expect(screen.getByText("1 aluno não será cobrado")).toBeInTheDocument();
    expect(screen.getByText("Já gerado").nextElementSibling).toHaveTextContent(/125,00/);
    expect(screen.getByText("nada repete se gerar de novo")).toBeInTheDocument();
  });

  it("CA9: total menor sai com o sinal de menos, igual sai igual e sem pulados todos serão cobrados", async () => {
    const { unmount } = setup({ preview: () => HttpResponse.json(data({ previousMonthTotalCents: 56000, skipped: [], alreadyGeneratedCents: 0 })) });
    await ready();
    expect(await screen.findByText(/em relação a novembro/)).toHaveTextContent(/^−\s.*80,00 em relação a novembro$/);
    expect(screen.getByText("todos serão cobrados")).toBeInTheDocument();
    expect(screen.getByText("Já gerado").nextElementSibling).toHaveTextContent(/0,00/);
    unmount();
    setup({ preview: () => HttpResponse.json(data({ previousMonthTotalCents: 48000 })) });
    expect(await screen.findByText("igual a novembro")).toBeInTheDocument();
  });

  it("CA10: por dia de vencimento com gera em, total, diferença e Ver alunos em cada linha", async () => {
    setup();
    await ready();
    const table = (await screen.findByRole("heading", { name: "Por dia de vencimento" })).closest("section")!;
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(/Dia 5 · gera em 25\/11.*2.*180,00.*igual/);
    expect(rows[1]).toHaveTextContent(/Dia 10 · gera em 30\/11.*1.*100,00.*\+ .*50,00/);
    expect(rows[2]).toHaveTextContent(/Dia 15 · gera em 05\/12.*2.*200,00.*igual/);
    expect(within(table).getAllByRole("button", { name: /^Ver alunos do dia/ })).toHaveLength(3);
    expect(within(table).getByRole("columnheader", { name: "Diferença para novembro" })).toBeInTheDocument();
  });

  it("CA11: Ver alunos abre as linhas do dia com o desconto e clicar de novo recolhe", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Total previsto");
    expect(screen.queryByText("Aluno 1")).toBeNull();
    const button = screen.getByRole("button", { name: "Ver alunos do dia 5" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Aluno 1")).toBeInTheDocument();
    expect(screen.getByText(/desconto de/)).toBeInTheDocument();
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Aluno 1")).toBeNull();
  });

  it("CA12: os motivos do canvas, motivo sem texto vira Não será cobrado sem quebrar a tela (B14) e a nota de rodapé", async () => {
    const reasons = ["INVENTADO", "FULL_BENEFIT", "OVERDUE_BLOCK", "END_REQUESTED", "MODALITY_ENDED"];
    const texts = ["Não será cobrado", "Bolsa de 100%", "Modalidade bloqueada por atraso", "Encerramento solicitado", "Modalidade encerrada"];
    setup({
      preview: () =>
        HttpResponse.json(
          data({ skipped: reasons.map((reason, i) => ({ studentId: `k${i}`, student: `Fulano ${i}`, modality: "Judô", referenceMonth: "2099-12-01", reason })) }),
        ),
    });
    await ready();
    const table = (await screen.findByRole("heading", { name: "Quem não será cobrado e por quê" })).closest("section")!;
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Aluno", "Modalidade", "Motivo"]);
    for (const [i, text] of texts.entries()) {
      const row = within(table).getByText(`Fulano ${i}`).closest("tr")!;
      expect(row).toHaveTextContent(text);
      expect(row).toHaveTextContent("Judô");
    }
    expect(screen.getByText(/abra "Ver alunos"/)).toBeInTheDocument();
  });

  it("CA13: com todas as unidades pede a escolha e só chama a rota depois dela; trocar para 60 dias manda days=60", async () => {
    const user = userEvent.setup();
    setup({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }, { id: "u2", name: "Norte", shortName: "n" }] });
    await ready();
    expect(await screen.findByText("Escolha uma unidade", { selector: "p, h2, h3" })).toBeInTheDocument();
    expect(calls).toHaveLength(0);
    await user.selectOptions(screen.getByRole("combobox", { name: "Unidade" }), "u2");
    await screen.findByText("Total previsto");
    expect(calls.at(-1)!.get("unitId")).toBe("u2");
    await user.selectOptions(screen.getByRole("combobox", { name: "Período" }), "60");
    await waitFor(() => expect(calls.at(-1)!.get("days")).toBe("60"));
  });

  it("CA16: vazio com a frase do período, erro com tentar de novo e carregando", async () => {
    const user = userEvent.setup();
    let mode: "empty" | "error" = "error";
    setup({ preview: () => (mode === "error" ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(data({ days: [], count: 0, totalCents: 0, skipped: [] }))) });
    await ready();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    mode = "empty";
    await user.click(retry);
    expect(await screen.findByText("Nada a gerar nos próximos 30 dias")).toBeInTheDocument();
  });

  it("CA15: 403 da rota vira sem permissão; quem só lê vê os dados sem os botões de ajuste", async () => {
    const { unmount } = setup({ preview: () => HttpResponse.json({}, { status: 403 }) });
    await ready();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    unmount();
    setup({ level: "READ" });
    await screen.findByText("Total previsto");
    await openAll(userEvent.setup());
    expect(screen.getByText("Aluno 1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Trocar vencimento/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Cancelar mensalidade/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Aplicar benefício/ })).toBeNull();
  });

  it("CA14: só a linha ajustável tem as três ações; trocar vencimento envia a data e recarrega", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Total previsto");
    await openAll(user);
    expect(screen.getAllByRole("button", { name: /^Trocar vencimento de / })).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: /^Aplicar benefício a / })).toHaveLength(4);
    const before = calls.length;
    await user.click(screen.getByRole("button", { name: "Trocar vencimento de Aluno 1" }));
    const dialog = await screen.findByRole("dialog", { name: "Trocar vencimento" });
    const field = within(dialog).getByLabelText("Novo vencimento");
    expect(field).toHaveAttribute("max", "2099-12-31");
    await user.clear(field);
    await user.type(field, "2099-12-20");
    await user.click(within(dialog).getByRole("button", { name: "Trocar vencimento" }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({ method: "PATCH", body: { dueOn: "2099-12-20" } });
    expect(writes[0].url).toContain("/students/s1/modalities/r1/next-charge");
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA14: cancelar sem motivo não envia e mostra o erro; com motivo envia o mês da linha e recarrega", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Total previsto");
    await openAll(user);
    const before = calls.length;
    await user.click(screen.getByRole("button", { name: "Cancelar mensalidade de Aluno 3" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancelar mensalidade" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar mensalidade" }));
    expect(await within(dialog).findByText("Informe o motivo para continuar.")).toBeInTheDocument();
    expect(writes).toHaveLength(0);
    await user.type(within(dialog).getByLabelText(/^Motivo/), "  Aluno viajando ");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar mensalidade" }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]).toMatchObject({ method: "POST", body: { reason: "Aluno viajando", referenceMonth: "2099-12-01" } });
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
  });

  it("falha do servidor na janela mostra a mensagem e mantém a janela aberta", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.post("/api/v1/students/:id/modalities/:row/next-charge/cancel", () => HttpResponse.json({ code: "CONFLICT", message: "x", fields: [] }, { status: 409 })));
    await screen.findByText("Total previsto");
    await openAll(user);
    await user.click(screen.getByRole("button", { name: "Cancelar mensalidade de Aluno 1" }));
    const dialog = await screen.findByRole("dialog", { name: "Cancelar mensalidade" });
    await user.type(within(dialog).getByLabelText(/^Motivo/), "x");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar mensalidade" }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA14: Aplicar benefício abre a janela da concessão com aluno e modalidade", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/v1/benefits/preview", () =>
        HttpResponse.json({ plan: { id: "p1", name: "Mensal", valueCents: 10000 }, current: null, newMonthlyValueCents: 7000, effectiveFrom: "2099-12", replaces: false, high: false }),
      ),
      http.get("/api/v1/teachers", () => HttpResponse.json({ items: [], page: 1, size: 100, total: 0 })),
    );
    setup();
    await screen.findByText("Total previsto");
    await openAll(user);
    await user.click(screen.getByRole("button", { name: "Aplicar benefício a Aluno 2" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText(/Jiu-Jitsu/).length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText(/Aluno 2/).length).toBeGreaterThan(0);
  });

  it("CA17: a 360 px com dados o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDeviceNarrow(true, dark);
      window.innerWidth = 360;
      const { container, unmount } = setup();
      await ready();
      await screen.findByText("Total previsto");
      expect(screen.queryAllByRole("table")).toHaveLength(0);
      await openAll(userEvent.setup());
      expect(screen.getByText("Aluno 1")).toBeInTheDocument();
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("trocar vencimento: sem data ou com a janela fechada nada é enviado, falha do servidor aparece e Esc fecha; cancelar ignora o segundo envio enquanto grava", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.patch("/api/v1/students/:id/modalities/:row/next-charge", () => HttpResponse.json({ code: "CONFLICT", message: "x", fields: [] }, { status: 409 })));
    await screen.findByText("Total previsto");
    await openAll(user);
    await user.click(screen.getByRole("button", { name: "Trocar vencimento de Aluno 1" }));
    let dialog = await screen.findByRole("dialog", { name: "Trocar vencimento" });
    await user.clear(within(dialog).getByLabelText("Novo vencimento"));
    fireEvent.submit(dialog.querySelector("form")!);
    expect(writes).toHaveLength(0);
    await user.type(within(dialog).getByLabelText("Novo vencimento"), "2099-12-20");
    await user.click(within(dialog).getByRole("button", { name: "Trocar vencimento" }));
    expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    const hold = gate();
    server.use(
      http.post("/api/v1/students/:id/modalities/:row/next-charge/cancel", async ({ request }) => {
        writes.push({ method: "POST", url: request.url, body: await request.json() });
        await hold.opened;
        return HttpResponse.json({ chargeId: "c1", referenceMonth: "2099-12-01" });
      }),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar mensalidade de Aluno 3" }));
    dialog = await screen.findByRole("dialog", { name: "Cancelar mensalidade" });
    await user.type(within(dialog).getByLabelText(/^Motivo/), "Viagem");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar mensalidade" }));
    await waitFor(() => expect(writes).toHaveLength(1));
    fireEvent.submit(dialog.querySelector("form")!);
    hold.release();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(writes).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Cancelar mensalidade de Aluno 2" }));
    await screen.findByRole("dialog", { name: "Cancelar mensalidade" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA3 (D1): Gerar próximas mensalidades abre a janela e, ao concluir, a prévia recarrega; quem só consulta não vê o botão", async () => {
    const user = userEvent.setup();
    setup();
    server.use(
      http.get("/api/v1/students", () => HttpResponse.json({ items: [{ id: "s1", name: "Maria Lima" }], page: 1, size: 25, total: 1 })),
      http.get("/api/v1/students/s1/enrollment", () => HttpResponse.json(enrollmentOf([modalityRow()]))),
      http.get("/api/v1/students/:id/modalities/:row/charges/advance/preview", () =>
        HttpResponse.json({ items: [{ referenceMonth: "2099-12-01", dueOn: "2099-12-05", amountCents: 20000 }], totalCents: 20000 }),
      ),
      http.post("/api/v1/students/:id/modalities/:row/charges/advance", () =>
        HttpResponse.json([{ id: "c9", modalityRowId: "m1", type: "MONTHLY", unitId: "u1", referenceMonth: "2099-12-01", dueOn: "2099-12-05", toleranceDays: 0, amountCents: 20000 }], { status: 201 }),
      ),
    );
    await ready();
    await screen.findByText("Total previsto");
    const before = calls.length;
    await user.click(screen.getByRole("button", { name: "Gerar próximas mensalidades" }));
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "li");
    await user.click(await screen.findByRole("button", { name: "Maria Lima" }));
    await user.selectOptions(await screen.findByLabelText("Modalidade"), "m1");
    await user.click(screen.getByRole("radio", { name: "1" }));
    await user.click(await screen.findByRole("button", { name: "Gerar 1 mensalidade" }));
    expect(await screen.findByText(/1 mensalidade criada/)).toBeInTheDocument();
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
  });

  it("CA3: Esc fecha a janela de gerar mensalidades sem gerar nada", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await screen.findByText("Total previsto");
    await user.click(screen.getByRole("button", { name: "Gerar próximas mensalidades" }));
    await screen.findByRole("dialog", { name: "Gerar próximas mensalidades" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA3: com cobranças só de consulta, a Prévia não oferece Gerar próximas mensalidades", async () => {
    setup({ level: "READ" });
    await ready();
    await screen.findByText("Total previsto");
    expect(screen.queryByRole("button", { name: "Gerar próximas mensalidades" })).not.toBeInTheDocument();
  });
});
