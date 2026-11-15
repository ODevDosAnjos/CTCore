import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { enrollmentOf, modalityRow } from "@/features/students/enrollmentFixtures";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { GrantBenefitDialog, type GrantTarget } from "./GrantBenefitDialog";
import type { BenefitRow } from "./useBenefits";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "Carla Mendes" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role: "COORDINATOR", unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
};
const fixed: GrantTarget = { studentId: "s1", studentName: "Davi Nogueira", modalityRowId: "m1", modalityName: "Jiu-Jitsu" };
const current: BenefitRow = {
  id: "b0",
  student: { id: "s1", name: "Davi Nogueira" },
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "mod1", name: "Jiu-Jitsu" },
  type: "PERCENT",
  value: 50,
  reason: "Atleta da equipe kids",
  decidedBy: "Mestre",
  grantedBy: "Gestora",
  validUntil: "2026-12-31",
  status: "ACTIVE",
  high: false,
  monthlyValueCents: 7500,
  planValueCents: 15000,
  nextChargeMonth: "2026-11",
};
const previewOf = (over: Record<string, unknown> = {}) => ({
  plan: { id: "p1", name: "Kids 2x", valueCents: 15000 },
  current: null,
  newMonthlyValueCents: 4500,
  effectiveFrom: "2026-11",
  replaces: false,
  high: true,
  ...over,
});

let granted: unknown[];
const onDone = vi.fn();
const onClose = vi.fn();

function setup(preview: Record<string, unknown> = previewOf(), post?: () => Response, props: { fixed?: GrantTarget } = { fixed }) {
  granted = [];
  onDone.mockClear();
  onClose.mockClear();
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.post("/api/v1/benefits/preview", () => HttpResponse.json(preview)),
    http.post("/api/v1/benefits", async ({ request }) => {
      granted.push(await request.json());
      return post ? post() : HttpResponse.json(current, { status: 201 });
    }),
  );
  return render(
    <ThemeProvider>
      <SessionProvider>
        <GrantBenefitDialog {...props} onClose={onClose} onDone={onDone} />
      </SessionProvider>
    </ThemeProvider>,
  );
}

const fill = async (user: ReturnType<typeof userEvent.setup>, percent = "70") => {
  await user.type(screen.getByLabelText("Percentual"), percent);
  await user.selectOptions(await screen.findByRole("combobox", { name: /^Decidido por/ }), "Carla Mendes");
  await user.type(screen.getByLabelText(/^Motivo/), "Atleta da equipe");
};
const grant = () => screen.getByRole("button", { name: "Conceder benefício" });

describe("janela Conceder benefício (RF-BEN-02)", () => {
  it("CA7, CA8: campos do canvas, rodapé Lançado por e resumo com mês, aviso acima de 50%; confirma sem substituição", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = screen.getByRole("dialog", { name: "Conceder benefício em Jiu-Jitsu" });
    expect(within(dialog).getByText("Davi Nogueira")).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: /Bolsa/ })).toBeChecked();
    expect(within(dialog).getByText("Percentual de 1 a 100%")).toBeInTheDocument();
    expect(within(dialog).getByText("Nunca deixa abaixo de zero")).toBeInTheDocument();
    expect(within(dialog).getByText("%")).toBeInTheDocument();
    expect(await within(dialog).findByText("Lançado por Carla Mendes")).toBeInTheDocument();
    expect(grant()).toBeDisabled();
    await fill(user);
    expect(await screen.findByText("Plano: Kids 2x · R$ 150,00")).toBeInTheDocument();
    expect(screen.getByText("Benefício: bolsa de 70%")).toBeInTheDocument();
    expect(screen.getByText("Nova mensalidade: R$ 45,00")).toBeInTheDocument();
    expect(screen.getByText("Vale a partir de nov/2026; a cobrança de out/2026 já gerada não muda.")).toBeInTheDocument();
    expect(screen.getByText("Acima de 50%: o Coordenador recebe um aviso.")).toBeInTheDocument();
    expect(screen.queryByText(/já tem/)).toBeNull();
    await user.click(grant());
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(granted).toEqual([{ studentId: "s1", modalityRowId: "m1", type: "PERCENT", value: 70, reason: "Atleta da equipe", decidedBy: "Carla Mendes", validUntil: null, replaceExisting: false }]);
    expect(onClose).toHaveBeenCalled();
  });

  it("CA8: com 30% a linha de aviso some; desconto em reais mostra o valor; 100% mostra a nota de mensalidade zero", async () => {
    const user = userEvent.setup();
    setup(previewOf({ high: false }));
    await fill(user, "30");
    await screen.findByText("Benefício: bolsa de 30%");
    expect(screen.queryByText(/Acima de 50%/)).toBeNull();
    await user.click(screen.getByRole("radio", { name: /Desconto em reais/ }));
    await user.type(screen.getByLabelText("Valor"), "3000");
    expect(await screen.findByText("Benefício: desconto de R$ 30,00")).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Bolsa/ }));
    server.use(http.post("/api/v1/benefits/preview", () => HttpResponse.json(previewOf({ newMonthlyValueCents: 0 }))));
    await user.clear(screen.getByLabelText("Percentual"));
    await user.type(screen.getByLabelText("Percentual"), "100");
    expect(await screen.findByText("Esta modalidade não vai gerar mensalidade. O aluno segue Ativo.")).toBeInTheDocument();
  });

  it("CA9: com benefício ativo avisa antes do valor; Conceder abre a confirmação sem gravar", async () => {
    const user = userEvent.setup();
    setup(previewOf({ current, replaces: true, newMonthlyValueCents: 4500 }));
    expect(await screen.findByText("Davi já tem uma bolsa de 50% nesta modalidade. Ela será encerrada ao conceder a nova.")).toBeInTheDocument();
    await fill(user);
    await screen.findByText("Nova mensalidade: R$ 45,00");
    await user.click(grant());
    expect(await screen.findByRole("dialog", { name: "Substituir benefício?" })).toBeInTheDocument();
    expect(granted).toEqual([]);
  });

  it("CA10: Substituir grava com replaceExisting e fecha as duas janelas; Manter o atual volta ao formulário preenchido", async () => {
    const user = userEvent.setup();
    setup(previewOf({ current, replaces: true, newMonthlyValueCents: 4500 }));
    await fill(user);
    await screen.findByText("Nova mensalidade: R$ 45,00");
    await user.click(grant());
    const confirm = await screen.findByRole("dialog", { name: "Substituir benefício?" });
    expect(within(confirm).getByText("Confirmando, o novo substitui o atual a partir da próxima cobrança gerada: R$ 45,00 em vez de R$ 75,00.")).toBeInTheDocument();
    await user.click(within(confirm).getByRole("button", { name: "Manter o atual" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Substituir benefício?" })).toBeNull());
    expect(granted).toEqual([]);
    expect(screen.getByLabelText("Percentual")).toHaveValue("70");
    await user.click(grant());
    await user.click(within(await screen.findByRole("dialog", { name: "Substituir benefício?" })).getByRole("button", { name: "Substituir" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(granted).toHaveLength(1);
    expect(granted[0]).toMatchObject({ type: "PERCENT", value: 70, replaceExisting: true });
    expect(onClose).toHaveBeenCalled();
  });

  it("CA11: 409 sem substituição mostra o conflito e não fecha", async () => {
    const user = userEvent.setup();
    setup(previewOf(), () => HttpResponse.json({ code: "CONFLICT" }, { status: 409 }));
    await fill(user);
    await screen.findByText("Nova mensalidade: R$ 45,00");
    await user.click(grant());
    expect(await screen.findByText(/Outra pessoa concedeu um benefício a esta modalidade/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("CA7: mostra o erro do servidor no campo e não fecha", async () => {
    const user = userEvent.setup();
    setup(previewOf(), () => HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "reason", message: "de 2 a 200 caracteres" }] }, { status: 400 }));
    await fill(user);
    await screen.findByText("Nova mensalidade: R$ 45,00");
    await user.click(grant());
    expect(await screen.findByText("de 2 a 200 caracteres")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("CA7: sem aluno, tipo, valor, decidido por ou motivo o botão fica desabilitado; falha no resumo pede nova tentativa", async () => {
    const user = userEvent.setup();
    setup();
    expect(grant()).toBeDisabled();
    server.use(http.post("/api/v1/benefits/preview", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    await user.type(screen.getByLabelText(/^Motivo/), "Atleta");
    await user.type(screen.getByLabelText("Percentual"), "70");
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(grant()).toBeDisabled();
  });

  it("CA7: de /beneficios, Modalidade fica desabilitada sem aluno; busca o aluno, escolhe a modalidade e grava", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/v1/students", () => HttpResponse.json({ items: [{ id: "s1", name: "Davi Nogueira" }, { id: "s2", name: "Beto Lima" }], page: 1, size: 25, total: 2 })),
      http.get("/api/v1/students/s1/enrollment", () => HttpResponse.json(enrollmentOf([modalityRow(), modalityRow({ id: "m2", canEdit: false })]))),
      http.get("/api/v1/students/s2/enrollment", () => HttpResponse.json(enrollmentOf([modalityRow({ status: "ENDED" })]))),
    );
    setup(previewOf(), undefined, {});
    expect(screen.getByLabelText("Modalidade")).toBeDisabled();
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "da");
    await user.click(await screen.findByRole("button", { name: /Beto Lima/ }));
    expect(await screen.findByText(/Este aluno não tem modalidade ativa/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Trocar o aluno Beto Lima" }));
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "da");
    await user.click(await screen.findByRole("button", { name: /Davi Nogueira/ }));
    const select = await screen.findByLabelText("Modalidade");
    await waitFor(() => expect(select).toBeEnabled());
    expect(screen.getAllByRole("option", { name: "Jiu-Jitsu · Centro · Plano Mensal" })).toHaveLength(1);
    await user.selectOptions(select, "m1");
    await fill(user);
    expect(await screen.findByText("Nova mensalidade: R$ 45,00")).toBeInTheDocument();
    await user.click(grant());
    await waitFor(() => expect(granted[0]).toMatchObject({ studentId: "s1", modalityRowId: "m1" }));
  });

  it("sem permissão na busca de alunos mostra o estado de sem permissão", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/v1/students", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 })));
    setup(previewOf(), undefined, {});
    await user.type(screen.getByLabelText("Buscar aluno pelo nome (mínimo 2 letras)"), "da");
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup(previewOf({ current, replaces: true }));
    await fill(user);
    await screen.findByText(/já tem uma bolsa/);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe("Decidido por e desconto de professor (RN-BEN-08, RN-PRO-08)", () => {
  it("CA12: Decidido por lista a conta e os professores; o texto segue em decidedBy; o professor opcional envia teacherId", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/v1/teachers", () => HttpResponse.json({ items: [{ id: "t1", name: "Marcos Leão" }], page: 1, size: 100, total: 1 })));
    setup();
    const decided = await screen.findByRole("combobox", { name: /^Decidido por/ });
    await waitFor(() => expect(within(decided).getAllByRole("option").map((o) => o.textContent)).toEqual(["Escolha quem decidiu", "Carla Mendes", "Marcos Leão"]));
    await user.type(screen.getByLabelText("Percentual"), "70");
    await user.selectOptions(decided, "Marcos Leão");
    await user.type(screen.getByLabelText(/^Motivo/), "Atleta");
    await user.selectOptions(await screen.findByLabelText("Desconto de professor (opcional)"), "t1");
    await screen.findByText("Nova mensalidade: R$ 45,00");
    await user.click(grant());
    await waitFor(() => expect(granted).toHaveLength(1));
    expect(granted[0]).toMatchObject({ decidedBy: "Marcos Leão", teacherId: "t1" });
  });

  it("CA12: sem professores o campo opcional não existe", async () => {
    server.use(http.get("/api/v1/teachers", () => HttpResponse.json({ items: [], page: 1, size: 100, total: 0 })));
    setup();
    await screen.findByRole("combobox", { name: /^Decidido por/ });
    await waitFor(() => expect(screen.queryByLabelText("Desconto de professor (opcional)")).toBeNull());
  });
});
