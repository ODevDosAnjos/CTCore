import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import type { PortalRequest } from "@/features/portal-requests/types";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const done: PortalRequest = {
  id: "r1", kind: "PLAN_CHANGE", status: "REFUSED", studentId: "s1", studentName: "Aluno", unitId: "u1", unit: "Centro", modalityRowId: "m1", modality: "Judô", targetClassId: null, targetClass: null,
  targetPlanId: "p2", targetPlan: "Judô Livre", targetModalityId: null, targetUnitId: null, targetUnit: null, reason: null, note: null, response: "Fale com a recepção.", createdAt: "2026-10-20T15:00:00Z", decidedAt: "2026-10-21T15:00:00Z", expiresAt: "2026-11-19", currentClass: "Judô Manhã", currentPlan: "Judô 2x",
};
const open: PortalRequest = { ...done, id: "r2", kind: "CLASS_CHANGE", status: "OPEN", response: null, decidedAt: null, targetClass: "Judô Noite", expiresAt: "2099-01-01" };
const approved: PortalRequest = { ...done, id: "r3", kind: "NEW_MODALITY", status: "APPROVED", response: null, modality: "Boxe", targetUnit: "Centro", createdAt: "2026-10-10T15:00:00Z" };
const judo = (closureRequestedAt: string | null, id = "m1", name = "Judô") => ({
  modalityRowId: id, modalityId: "d1", modality: name, unitId: "u1", unit: "Centro", currentClass: { id: "k1", name: "Judô Manhã" }, currentPlan: { id: "p1", name: "Judô 2x" }, closureRequestedAt,
  classes: [{ id: "k2", name: "Judô Noite", schedule: [{ weekday: 2, startsAt: "19:00", endsAt: "20:00" }, { weekday: 4, startsAt: "19:00", endsAt: "20:00" }], teacher: "Thiago Moreira" }],
  plans: [{ id: "p2", name: "Judô Livre", valueCents: 22000, available: true, unavailableReason: null }, { id: "p3", name: "Judô Kids", valueCents: 15000, available: false, unavailableReason: "AGE" }],
});
const offers = [{ unitId: "u1", unit: "Centro", modalityId: "d2", modality: "Boxe" }, { unitId: "u2", unit: "Norte", modalityId: "d3", modality: "Muay Thai" }];
const options = (rows = [judo(null)], list = offers) => ({ modalities: rows, offers: list });

let posted: unknown[];
function setup(over: { students?: () => Response; requests?: PortalRequest[]; options?: ReturnType<typeof options>; role?: string } = {}) {
  posted = [];
  window.history.replaceState(null, "", "/portal/pedidos");
  server.use(
    http.get("/api/v1/portal/shell", () =>
      HttpResponse.json({ organization: { name: "Academia Alfa", color: null, logoUrl: null }, reduced: false, unreadAnnouncements: 0, unit: { name: "Centro", address: "Rua A, 1", whatsapp: "(21) 97000-1200" } }),
    ),
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(over.role ?? "STUDENT"))),
    http.get("/api/v1/portal/term", () => HttpResponse.json([])),
    http.get("/api/v1/portal/students", over.students ?? (() => HttpResponse.json([{ id: "s1", name: "Aluno Adulto Fictício", photoUrl: null, self: true }]))),
    http.get("/api/v1/portal/students/:id/request-options", ({ params }) => HttpResponse.json(params.id === "s2" ? options([judo(null, "m9", "Boxe")]) : (over.options ?? options()))),
    http.get("/api/v1/portal/students/:id/requests", ({ params }) => HttpResponse.json(params.id === "s2" ? [] : (over.requests ?? [done]))),
    http.post("/api/v1/portal/students/:id/requests", async ({ request }) => {
      posted.push(await request.json());
      return HttpResponse.json(done, { status: 201 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/portal/pedidos"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
const ask = async (user: ReturnType<typeof userEvent.setup>, title: string) => user.click(await screen.findByRole("button", { name: `Pedir: ${title}` }));

afterEach(() => setDeviceNarrow(false));

describe("PortalRequestsPage do portal (RF-MAT-04, #500)", () => {
  it("CA1, CA14: cabeçalho, quatro cartões, sem seletor de aluno nem cartão antigo; axe nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      const { container, unmount } = setup();
      expect(await screen.findByRole("heading", { name: "Pedidos", level: 1 })).toBeInTheDocument();
      expect(screen.getAllByText("Minhas informações")).toHaveLength(2);
      expect(screen.getByText("A academia sempre confirma. Pedidos sem resposta expiram em 30 dias e você é avisado.")).toBeInTheDocument();
      for (const title of ["Trocar de turma", "Nova modalidade", "Trocar de plano", "Solicitar encerramento"]) expect(await screen.findByRole("button", { name: `Pedir: ${title}` })).toBeEnabled();
      expect(screen.getByText("A academia tem 7 dias para conversar com você")).toBeInTheDocument();
      expect(screen.queryByText("Fazer um pedido")).toBeNull();
      expect(screen.queryByRole("list", { name: "Alunos" })).toBeNull();
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("CA1: no celular tem Voltar, o subtítulo curto e só o título nos cartões", async () => {
    setDeviceNarrow(true);
    setup();
    expect(await screen.findByText("A academia sempre confirma. Sem resposta em 30 dias, o pedido expira.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Voltar" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Pedir: Trocar de turma" })).toHaveTextContent(/^Trocar de turma$/);
    expect(screen.queryByText("Escolha outra turma da mesma modalidade")).toBeNull();
  });

  it("CA2: sem modalidade ativa os três cartões ficam desabilitados; sem oferta, Nova modalidade", async () => {
    const { unmount } = setup({ options: options([], offers.slice(0, 1)) });
    expect(await screen.findByRole("button", { name: "Pedir: Trocar de turma" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pedir: Trocar de plano" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pedir: Solicitar encerramento" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pedir: Nova modalidade" })).toBeEnabled();
    unmount();
    setup({ options: options([judo(null)], []) });
    expect(await screen.findByRole("button", { name: "Pedir: Nova modalidade" })).toBeDisabled();
  });

  it("CA3: responsável com dois alunos escolhe o aluno e a tela recarrega", async () => {
    const user = userEvent.setup();
    setup({ students: () => HttpResponse.json([{ id: "s1", name: "Filho Um", photoUrl: null, self: false }, { id: "s2", name: "Filho Dois", photoUrl: null, self: false }]) });
    expect(await screen.findByText("Recusado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filho Dois" }));
    expect(await screen.findByText("Nenhum pedido ainda")).toBeInTheDocument();
  });

  it("CA4, CA5, CA6: a tabela mostra tipo, detalhe, data, situação e a nota de cada pedido", async () => {
    setup({ requests: [open, done, approved] });
    expect(await screen.findByRole("columnheader", { name: "Situação" })).toBeInTheDocument();
    expect(screen.getByText("Aguardando a academia")).toBeInTheDocument();
    expect(screen.getByText("Judô: Judô Manhã → Judô Noite")).toBeInTheDocument();
    expect(screen.getByText(/^expira em \d+ dias$/)).toBeInTheDocument();
    expect(screen.getByText("\"Fale com a recepção.\"")).toBeInTheDocument();
    expect(within(screen.getByRole("table")).queryByText(/WhatsApp/)).toBeNull();
    expect(screen.getAllByText("20/10/2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Aprovado").dataset.tone).toBe("ok");
    expect(screen.getByText("Recusado").dataset.tone).toBe("neutral");
    expect(screen.getByText("Aguardando a academia").dataset.tone).toBe("warn");
  });

  it("CA4: no celular os pedidos viram cartões com \"Aguardando\"", async () => {
    setDeviceNarrow(true);
    setup({ requests: [open] });
    expect(await screen.findByText("Aguardando")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("CA6: troca de turma lista a turma com dias, horário e professor e envia o pedido", async () => {
    const user = userEvent.setup();
    setup();
    await ask(user, "Trocar de turma");
    const dialog = await screen.findByRole("dialog", { name: "Pedir troca de turma" });
    expect(within(dialog).getByText("Judô · Centro")).toBeInTheDocument();
    const submit = within(dialog).getByRole("button", { name: "Enviar pedido" });
    expect(submit).toBeDisabled();
    expect(within(dialog).getAllByRole("option").map((o) => o.textContent).slice(1)).toEqual(["Judô Noite · Ter e Qui 19h · Thiago Moreira"]);
    expect(within(dialog).getByText("Plano e mensalidade não mudam. A troca vale quando a academia aprovar.")).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText(/^Nova turma principal/), "k2");
    await user.type(within(dialog).getByLabelText(/^Mensagem para a academia/), "Troco por causa do trabalho");
    await user.click(submit);
    await waitFor(() => expect(posted).toEqual([{ kind: "CLASS_CHANGE", note: "Troco por causa do trabalho", modalityRowId: "m1", targetClassId: "k2" }]));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA11: com duas modalidades \"Modalidade\" é seletor e a lista de turmas muda", async () => {
    const user = userEvent.setup();
    const outra = { ...judo(null, "m2", "Boxe"), classes: [{ id: "k9", name: "Boxe Noite", schedule: [{ weekday: 1, startsAt: "20:30", endsAt: "21:30" }], teacher: "Ana Lima" }] };
    setup({ options: options([judo(null), outra]) });
    await ask(user, "Trocar de turma");
    const dialog = await screen.findByRole("dialog", { name: "Pedir troca de turma" });
    expect(within(dialog).queryByLabelText(/^Nova turma principal/)).toBeNull();
    await user.selectOptions(within(dialog).getByLabelText(/^Modalidade/), "m2");
    expect(within(dialog).getAllByRole("option").map((o) => o.textContent).slice(-1)).toEqual(["Boxe Noite · Seg 20h30 · Ana Lima"]);
  });

  it("CA7: troca de plano mostra o plano atual, valores e o plano fora da idade desabilitado", async () => {
    const user = userEvent.setup();
    setup();
    await ask(user, "Trocar de plano");
    const dialog = await screen.findByRole("dialog", { name: "Pedir troca de plano" });
    expect(within(dialog).getByText("Judô 2x")).toBeInTheDocument();
    expect(within(dialog).getByText("R$ 220,00")).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: /Judô Kids/ })).toBeDisabled();
    expect(within(dialog).getByText("Não disponível para a sua idade")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("radio", { name: /Judô Livre/ }));
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    await waitFor(() => expect(posted).toEqual([{ kind: "PLAN_CHANGE", modalityRowId: "m1", targetPlanId: "p2" }]));
  });

  it("CA8: nova modalidade tem unidade e modalidade separadas, resumo com 3 itens e envia os dois", async () => {
    const user = userEvent.setup();
    setup();
    await ask(user, "Nova modalidade");
    const dialog = await screen.findByRole("dialog", { name: "Pedir nova modalidade" });
    await user.selectOptions(within(dialog).getByLabelText(/^Unidade/), "u2");
    expect(within(dialog).getByLabelText(/^Modalidade/).textContent).toBe("EscolhaMuay Thai");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
    await user.selectOptions(within(dialog).getByLabelText(/^Modalidade/), "d3");
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    await waitFor(() => expect(posted).toEqual([{ kind: "NEW_MODALITY", targetUnitId: "u2", targetModalityId: "d3" }]));
  });

  it("CA9: solicitar encerramento exige o motivo, mostra o resumo e envia motivo e conversa", async () => {
    const user = userEvent.setup();
    setup({ options: options([judo(null), judo(null, "m2", "Boxe")]) });
    await ask(user, "Solicitar encerramento");
    const dialog = await screen.findByRole("dialog", { name: "Solicitar encerramento" });
    await user.selectOptions(within(dialog).getByLabelText(/^Modalidade/), "m1");
    const submit = within(dialog).getByRole("button", { name: "Enviar pedido" });
    expect(submit).toBeDisabled();
    expect(within(dialog).getByText(/fica "Encerramento solicitado" hoje, \d\d\/\d\d\/\d{4}\./)).toBeInTheDocument();
    expect(within(dialog).getByText("Boxe continua normal.")).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText(/^Motivo/), "FINANCIAL");
    await user.type(within(dialog).getByLabelText("Quer contar mais? (opcional)"), "Mudei de emprego");
    await user.click(submit);
    await waitFor(() => expect(posted).toEqual([{ kind: "CLOSURE", modalityRowId: "m1", reason: "FINANCIAL", note: "Mudei de emprego" }]));
  });

  it("CA10: com encerramento aberto, Pedir troca de turma e de plano só mostra o aviso e nada é enviado", async () => {
    const user = userEvent.setup();
    setup({ options: options([judo("2026-10-20T15:00:00Z", "m1", "Muay Thai")]) });
    for (const [title, dialogName] of [["Trocar de turma", "Pedir troca de turma"], ["Trocar de plano", "Pedir troca de plano"]]) {
      await ask(user, title);
      const dialog = await screen.findByRole("dialog", { name: dialogName });
      expect(within(dialog).getByText(/Há um pedido de encerramento aberto para o Muay Thai\. Enquanto ele estiver aberto/)).toBeInTheDocument();
      expect(within(dialog).getByText("Muay Thai · Centro")).toBeInTheDocument();
      expect(within(dialog).queryByRole("button", { name: "Enviar pedido" })).toBeNull();
      await user.click(within(dialog).getByRole("button", { name: "Entendi" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    }
    expect(posted).toEqual([]);
    await ask(user, "Solicitar encerramento");
    expect(await screen.findByRole("dialog", { name: "Solicitar encerramento" })).toBeInTheDocument();
  });

  it("CA12: 409 mostra o aviso na janela e não fecha; 403 mostra a mensagem do servidor", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.post("/api/v1/portal/students/:id/requests", () => HttpResponse.json({ code: "REQUEST_ALREADY_OPEN", message: "x" }, { status: 409 })));
    await ask(user, "Trocar de plano");
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: /Judô Livre/ }));
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Já existe um pedido igual em aberto.");
    server.use(http.post("/api/v1/portal/students/:id/requests", () => HttpResponse.json({ code: "FORBIDDEN", message: "x" }, { status: 403 })));
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    expect(await within(dialog).findByText("Só o aluno adulto ou o responsável financeiro pode fazer pedidos.")).toBeInTheDocument();
  });

  it("CA14: sem pedidos mostra o vazio; falha mostra erro com nova tentativa; 403 mostra sem permissão", async () => {
    const { unmount } = setup({ requests: [] });
    expect(await screen.findByText("Nenhum pedido ainda")).toBeInTheDocument();
    unmount();
    const err = setup({ students: () => new HttpResponse(null, { status: 500 }) });
    expect(await screen.findByRole("button", { name: /tentar de novo/i })).toBeInTheDocument();
    err.unmount();
    setup({ students: () => HttpResponse.json({ code: "FORBIDDEN", message: "x" }, { status: 403 }) });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });
});
