import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
import type { UnitDetail } from "./useUnitSettings";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const detail = (id: string, name: string): UnitDetail => ({
  id,
  name,
  shortName: name.toLowerCase().replace(" ", "-"),
  postalCode: null,
  address: null,
  city: null,
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  whatsapp: null,
  cnpj: null,
  active: true,
  timezone: "America/Sao_Paulo",
  version: 0,
  lastChange: null,
  settings: {
    dueDays: [1, 5, 10, 15],
    enrollmentFeeEnabled: false,
    enrollmentFeeCents: 0,
    feesCents: { cash: 0, pix: 0, bankSlip: 0, creditCard: 0, debitCard: 0, automaticDebit: 0, manualPix: 0, terminalCard: 0, transfer: 0 },
    pixKey: null,
    paymentAccount: "NOT_CONNECTED",
    reminderDays: [-3, 0, 3, 10],
    remindersEnabled: true,
    remindersHour: 9,
    teacherPermissions: { announcements: true, agendaEdit: true, studentContacts: true, trialClasses: true, studentRecord: false },
    directoryEnabled: false,
    trialLinkEnabled: true,
    selfRegistrationLinkEnabled: true,
  },
});
const reach = (d: UnitDetail) => ({ id: d.id, name: d.name, shortName: d.shortName });

type Sent = { name: string; settings: Record<string, unknown> } & Record<string, unknown>;
let stored: Record<string, UnitDetail>;
let puts: { id: string; body: Sent }[];

function setup(
  role: string,
  opts: { units?: UnitDetail[]; path?: string; read?: () => Response | Promise<Response>; reachable?: () => Response } = {},
) {
  const units = opts.units ?? [detail(A, "Unidade A")];
  stored = Object.fromEntries(units.map((u) => [u.id, u]));
  puts = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", opts.reachable ?? (() => HttpResponse.json({ allUnits: role === "COORDINATOR", units: units.map(reach) }))),
    http.get("/api/v1/units/:id/modalities", () => HttpResponse.json({ canManage: true, items: [{ id: "m1", name: "Judô", offered: true, classCount: 1, planCount: 3, graduationEnabled: true }] })),
    http.get("/api/v1/units/:id", opts.read ?? (({ params }) => HttpResponse.json(stored[String(params.id)]))),
    http.put("/api/v1/units/:id", async ({ request, params }) => {
      const body = (await request.json()) as Sent;
      puts.push({ id: String(params.id), body });
      if (body.settings.pixKey === "recusada") {
        return HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "settings.pixKey", message: "chave recusada pelo servidor" }] }, { status: 400 });
      }
      const current = stored[String(params.id)]!;
      stored[current.id] = { ...current, ...body, settings: { ...current.settings, ...body.settings } } as UnitDetail;
      return HttpResponse.json(stored[current.id]);
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[opts.path ?? "/configuracoes/unidade"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = async (title = "Unidade A") => {
  await screen.findByRole("heading", { name: title, level: 1 });
  await screen.findByLabelText("Nome");
};
const save = () => screen.getByRole("button", { name: "Salvar alterações" });
const discard = () => screen.getByRole("button", { name: "Descartar" });
const openTab = (user: ReturnType<typeof userEvent.setup>, name: string) => user.click(screen.getByRole("tab", { name: new RegExp(`^${name}`) }));

describe("UnitSettingsPage (RF-ORG-04)", () => {
  it("CA1: mostra o título, o subtítulo, a última alteração e as cinco abas na ordem do canvas", async () => {
    setup("COORDINATOR", { units: [{ ...detail(A, "Tijuca"), lastChange: { at: "2026-05-20T15:30:00Z", by: "Bia" } }] });
    await ready("Unidade Tijuca");
    expect(screen.getByText("tijuca · cada unidade tem seus dados, recebimentos e links")).toBeInTheDocument();
    expect(screen.getByText("Última alteração em 20/05/2026 12h30 por Bia")).toBeInTheDocument();
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Dados", "Pagamentos", "Lembretes", "Links", "Permissões do Professor"]);
  });

  it("CA2: o que foi digitado numa aba continua depois de trocar de aba e voltar, inclusive nos campos com máscara", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.type(screen.getByLabelText("Nome"), "!");
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "21999998888" } });
    await openTab(user, "Lembretes");
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    await openTab(user, "Dados");
    expect(screen.getByLabelText("Nome")).toHaveValue("Unidade A!");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(21) 99999-8888");
  });

  it("CA3: sem alteração os dois botões ficam desabilitados; alterado, ativos; Descartar volta tudo ao salvo; Salvar mostra Salvo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();
    await user.type(screen.getByLabelText("Nome"), "!");
    await openTab(user, "Permissões do Professor");
    await user.click(screen.getByRole("switch", { name: "Ver ficha do aluno" }));
    expect(save()).toBeEnabled();
    expect(discard()).toBeEnabled();
    await user.click(discard());
    expect(screen.getByRole("switch", { name: "Ver ficha do aluno" })).not.toBeChecked();
    await openTab(user, "Dados");
    expect(screen.getByLabelText("Nome")).toHaveValue("Unidade A");
    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();
    await user.type(screen.getByLabelText("Nome"), "!");
    await user.click(save());
    expect(await screen.findByText("Salvo")).toBeInTheDocument();
    expect(puts).toHaveLength(1);
    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();
  });

  it("CA17: salva as cinco abas num único PUT, em centavos, com o telefone limpo", async () => {
    const user = userEvent.setup({ delay: null });
    setup("COORDINATOR");
    await ready();
    fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "21999998888" } });
    await user.click(screen.getByRole("button", { name: "Dia 15" }));
    await user.click(screen.getByRole("button", { name: "Dia 20" }));
    await user.click(screen.getByRole("switch", { name: "Cobrar taxa de matrícula" }));
    fireEvent.change(screen.getByLabelText("Valor da taxa"), { target: { value: "15000" } });
    expect(screen.getByLabelText("Valor da taxa")).toHaveValue("R$ 150,00");
    await openTab(user, "Pagamentos");
    fireEvent.change(screen.getByLabelText("Pix"), { target: { value: "199" } });
    await openTab(user, "Lembretes");
    await user.click(screen.getByRole("switch", { name: "3 dias depois" }));
    await openTab(user, "Links");
    await user.click(screen.getByRole("switch", { name: "Pedido de aula experimental" }));
    await openTab(user, "Permissões do Professor");
    await user.click(screen.getByRole("switch", { name: "Editar e cancelar aulas" }));
    await user.click(screen.getByRole("switch", { name: "Ver ficha do aluno" }));
    await user.click(save());
    expect(await screen.findByText("Salvo")).toBeInTheDocument();
    expect(puts).toHaveLength(1);
    const { settings, ...data } = puts[0]!.body;
    expect(data).toMatchObject({ name: "Unidade A", phone: "21999998888", cnpj: null, latitude: null });
    expect(settings.dueDays).toEqual([1, 5, 10, 20]);
    expect(settings).toMatchObject({ enrollmentFeeEnabled: true, enrollmentFeeCents: 15000, reminderDays: [-3, 0, 10], trialLinkEnabled: false, directoryEnabled: false });
    expect((settings.feesCents as Record<string, number>).pix).toBe(199);
    expect(settings.teacherPermissions).toEqual({ announcements: true, agendaEdit: false, studentContacts: true, trialClasses: true, studentRecord: true });
    await openTab(user, "Dados");
    expect(screen.getByLabelText("Telefone")).toHaveValue("(21) 99999-8888");
  });

  it("CA17: erro 400 do servidor abre a aba do campo, marca a aba e aparece junto do campo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await openTab(user, "Pagamentos");
    await user.selectOptions(screen.getByLabelText("Tipo"), "RANDOM");
    await user.type(screen.getByLabelText("Chave"), "recusada");
    await user.click(save());
    expect(await screen.findByText("chave recusada pelo servidor")).toBeInTheDocument();
    expect(screen.getByLabelText("Chave")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("tab", { name: /Pagamentos/ })).toContainElement(screen.getByRole("img", { name: "Há erro nesta aba" }));
    expect(screen.getByRole("alert", { name: "" })).toHaveTextContent("Não foi possível salvar");
  });

  it("CA17: o erro do servidor em outra aba leva à aba do campo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await openTab(user, "Pagamentos");
    await user.selectOptions(screen.getByLabelText("Tipo"), "RANDOM");
    await user.type(screen.getByLabelText("Chave"), "recusada");
    await openTab(user, "Dados");
    await user.click(save());
    expect(await screen.findByText("chave recusada pelo servidor")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pagamentos/ })).toHaveAttribute("aria-selected", "true");
  });

  it("CA17: CEP novo vai sem coordenadas (o servidor busca)", async () => {
    const user = userEvent.setup();
    const withCoords = { ...detail(A, "Unidade A"), postalCode: "01001000", latitude: -1.5, longitude: 2.5 };
    setup("COORDINATOR", { units: [withCoords] });
    await ready();
    expect(screen.getByLabelText("CEP")).toHaveValue("01001-000");
    await user.clear(screen.getByLabelText("CEP"));
    await user.type(screen.getByLabelText("CEP"), "20040020");
    await user.click(save());
    await screen.findByText("Salvo");
    expect(puts[0]!.body).toMatchObject({ postalCode: "20040020", latitude: null, longitude: null });
  });

  it("CA5: nome vazio, e-mail inválido, nenhum vencimento ou coordenadas incompletas mostram o erro no campo, bloqueiam o Salvar e marcam a aba", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.type(screen.getByLabelText("E-mail"), "ruim");
    expect(screen.getByText("Confira o e-mail digitado.")).toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(screen.getByRole("tab", { name: /Dados/ })).toContainElement(screen.getByRole("img", { name: "Há erro nesta aba" }));
    await user.clear(screen.getByLabelText("E-mail"));
    expect(save()).toBeDisabled(); // nada mudou de fato
    await user.clear(screen.getByLabelText("Nome"));
    expect(screen.getByText("Informe o nome da unidade.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome"), "N");
    for (const day of [1, 5, 10, 15]) await user.click(screen.getByRole("button", { name: `Dia ${day}` }));
    expect(screen.getByText("Escolha ao menos um dia de vencimento.")).toBeInTheDocument();
    expect(save()).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Dia 7" }));
    await user.click(screen.getByText("Ajustar latitude e longitude"));
    await user.type(screen.getByLabelText("Latitude"), "10");
    expect(screen.getByText(/Informe latitude e longitude juntas/)).toBeInTheDocument();
    expect(save()).toBeDisabled();
  });

  it("CA5: Enter com erro, em outra aba, abre a aba Dados e leva o foco ao primeiro campo inválido", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.type(screen.getByLabelText("E-mail"), "ruim");
    await openTab(user, "Pagamentos");
    await user.type(screen.getByLabelText("Chave"), "{Enter}");
    expect(screen.getByRole("tab", { name: /Dados/ })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(screen.getByLabelText("E-mail")).toHaveFocus());
    expect(puts).toHaveLength(0);
    // Trocar de aba depois não puxa o foco de volta.
    await openTab(user, "Lembretes");
    expect(screen.getByRole("tab", { name: /Lembretes/ })).toHaveAttribute("aria-selected", "true");
  });

  it("CA6: com a taxa de matrícula desligada o valor fica desabilitado; ligada e vazia, grava 0", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    expect(screen.getByLabelText("Valor da taxa")).toBeDisabled();
    await user.click(screen.getByRole("switch", { name: "Cobrar taxa de matrícula" }));
    expect(screen.getByLabelText("Valor da taxa")).toBeEnabled();
    await user.click(save());
    await screen.findByText("Salvo");
    expect(puts[0]!.body.settings).toMatchObject({ enrollmentFeeEnabled: true, enrollmentFeeCents: 0 });
  });

  it("CA7: o cartão de modalidades mostra as modalidades da unidade com a graduação e o diretório fica desabilitado com Em breve (CA8)", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    expect(await screen.findByRole("heading", { name: /^Modalidades oferecidas na / })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Judô" })).toBeChecked();
    expect(screen.getByRole("heading", { name: /^Modalidades oferecidas na / }).compareDocumentPosition(screen.getByRole("heading", { name: "Dados da unidade" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const directory = screen.getByRole("switch", { name: "Aparecer no diretório ctcore.com.br/academias" });
    expect(directory).toHaveAttribute("aria-disabled", "true");
    await user.click(directory);
    expect(directory).not.toBeChecked();
    expect(save()).toBeDisabled();
    expect(screen.getByText("Fuso horário")).toBeInTheDocument();
    expect(screen.getByLabelText("Fuso horário")).toBeDisabled();
    expect(screen.getByLabelText("Fuso horário")).toHaveDisplayValue("Brasília (UTC−3)");
  });

  it("CA8: o valor salvo do diretório segue o mesmo no PUT", async () => {
    const user = userEvent.setup();
    const on = detail(A, "Unidade A");
    on.settings.directoryEnabled = true;
    setup("COORDINATOR", { units: [on] });
    await ready();
    await user.type(screen.getByLabelText("Nome"), "!");
    await user.click(save());
    await screen.findByText("Salvo");
    expect(puts[0]!.body.settings).toMatchObject({ directoryEnabled: true });
  });

  it("CA18: carregando, erro com Tentar de novo, sem permissão e Professor veem os estados certos", async () => {
    const user = userEvent.setup();
    const first = setup("COORDINATOR", { read: () => new Promise<Response>(() => {}) });
    // #519: o aviso de carregando da sessão e o da tela têm o mesmo texto; findBy sozinho devolvia um nó que já tinha sido trocado.
    await waitFor(() => expect(screen.getByText("Carregando...")).toBeInTheDocument());
    first.unmount();

    let fail = true;
    const second = setup("COORDINATOR", {
      read: () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(stored[A])),
    });
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    await ready();
    second.unmount();

    const third = setup("COORDINATOR", { read: () => HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 }) });
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
    third.unmount();

    const fourth = setup("ADMINISTRATOR", { reachable: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
    fourth.unmount();

    setup("TEACHER");
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
  });

  it("CA18: sem nenhuma unidade para configurar mostra o estado vazio", async () => {
    setup("ADMINISTRATOR", { units: [] });
    expect(await screen.findByRole("heading", { name: "Nenhuma unidade para configurar" })).toBeInTheDocument();
  });

  it("CA10: Administrador com duas unidades troca a unidade no topo e o formulário recarrega com a outra", async () => {
    const user = userEvent.setup();
    setup("ADMINISTRATOR", { units: [detail(A, "Unidade A"), detail(B, "Unidade B")] });
    await ready();
    expect(screen.getByLabelText("Nome")).toHaveValue("Unidade A");
    expect(screen.queryByRole("option", { name: "Todas as unidades" })).not.toBeInTheDocument();
    await user.click((await screen.findAllByRole("button", { name: /^Unidade ativa/ }))[0]);
    await user.click(screen.getByRole("button", { name: "Unidade B" }));
    await waitFor(() => expect(screen.getByLabelText("Nome")).toHaveValue("Unidade B"));
  });

  it("CA7: Coordenador em \"Todas as unidades\" vê o pedido de escolha e nenhum campo; ao escolher uma, o formulário aparece", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", { units: [detail(A, "Unidade A"), detail(B, "Unidade B")] });
    expect(await screen.findByText(/Escolha uma unidade no topo/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nome")).not.toBeInTheDocument();
    await user.click((await screen.findAllByRole("button", { name: /^Unidade ativa/ }))[0]);
    await user.click(screen.getByRole("button", { name: "Unidade B" }));
    await waitFor(() => expect(screen.getByLabelText("Nome")).toHaveValue("Unidade B"));
  });

  // #519: um `it` por aba e tema (antes era um só com 6 rodadas do axe e estourava os 20 s com a máquina carregada).
  const axeCases = ([["claro", false], ["escuro", true]] as const).flatMap(([n, dark]) =>
    ["Dados", "Pagamentos", "Lembretes", "Links", "Permissões do Professor", "Dados com erros"].map((tab) => [n, dark, tab] as const),
  );
  it.each(axeCases)("CA18: a 360 px não tem violações no axe no tema %s, na aba %s", async (_n, dark, tab) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR");
    await ready();
    await screen.findByRole("checkbox", { name: "Judô" });
    if (tab === "Dados com erros") {
      await user.clear(screen.getByLabelText("Nome"));
      await user.type(screen.getByLabelText("E-mail"), "ruim");
    } else if (tab !== "Dados") await openTab(user, tab);
    expect(await axeViolations(container)).toEqual([]);
  });
});

const BIA = { at: "2026-05-20T15:30:00Z", by: "Bia" };
const DIALOG = "Estes dados foram alterados por outra pessoa";

// A outra pessoa já salvou: o servidor está na versão 3 com outro nome; o primeiro PUT responde 409.
function conflicting(putStatuses: number[] = [409]) {
  const sent: { version: string | null; body: Sent }[] = [];
  const reads = { count: 0 };
  setup("COORDINATOR", {
    units: [{ ...detail(A, "Unidade A"), name: "Nome da outra pessoa", version: 3, lastChange: BIA }],
    read: () => {
      reads.count += 1;
      return HttpResponse.json(stored[A]);
    },
  });
  server.use(
    http.put("/api/v1/units/:id", async ({ request }) => {
      const body = (await request.json()) as Sent;
      sent.push({ version: request.headers.get("If-Match"), body });
      const status = putStatuses[Math.min(sent.length - 1, putStatuses.length - 1)];
      if (status === 409) return HttpResponse.json({ code: "EDIT_CONFLICT", message: "x", changed: false, fields: [], traceId: "t" }, { status });
      stored[A] = { ...stored[A]!, ...body, version: stored[A]!.version + 1 } as unknown as UnitDetail;
      return HttpResponse.json(stored[A]);
    }),
  );
  return { sent, reads };
}

describe("UnitSettingsPage: nome curto (RN-ORG-15, D3 da #484)", () => {
  it("a aba Dados ajusta o nome curto uma vez: PATCH, valor novo na tela e o botão some; 409 mostra a mensagem", async () => {
    const user = userEvent.setup();
    const patches: unknown[] = [];
    setup("COORDINATOR");
    server.use(
      http.patch("/api/v1/units/:id/short-name", async ({ request }) => {
        const body = (await request.json()) as { shortName: string };
        patches.push(body);
        return body.shortName === "em-uso" ? HttpResponse.json({ code: "CONFLICT", fields: [] }, { status: 409 }) : HttpResponse.json({});
      }),
    );
    await user.click(await screen.findByRole("button", { name: "Ajustar nome curto" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Novo nome curto"), "em-uso");
    await user.click(within(dialog).getByRole("button", { name: "Ajustar" }));
    expect(await within(dialog).findByText("Este nome curto não está disponível. Escolha outro.")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText("Novo nome curto"));
    await user.type(within(dialog).getByLabelText("Novo nome curto"), "centro-novo");
    await user.click(within(dialog).getByRole("button", { name: "Ajustar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(patches).toEqual([{ shortName: "em-uso" }, { shortName: "centro-novo" }]);
    expect(screen.getByLabelText("Nome curto")).toHaveValue("centro-novo");
    expect(screen.queryByRole("button", { name: "Ajustar nome curto" })).toBeNull();
  });
});

describe("UnitSettingsPage: última alteração e edição simultânea (RF-ORG-08, RNF-15)", () => {
  it("CA9: sem registro mostra 'Ainda sem alterações'", async () => {
    setup("COORDINATOR");
    await ready();
    expect(screen.getByText("Ainda sem alterações")).toBeInTheDocument();
  });

  it("CA4: o 409 abre a janela com quem alterou e os campos diferentes das cinco abas, com os dois valores; a gravação levou o If-Match lido", async () => {
    const user = userEvent.setup();
    const { sent } = conflicting();
    await ready("Unidade Nome da outra pessoa");
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Meu nome");
    await openTab(user, "Permissões do Professor");
    await user.click(await screen.findByRole("switch", { name: "Editar e cancelar aulas" }));
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    expect(sent[0]?.version).toBe("3");
    expect(await within(dialog).findByText("Última alteração em 20/05/2026 12h30 por Bia")).toBeInTheDocument();
    const nome = within(dialog).getByText("Nome").closest("li")!;
    expect(nome).toHaveTextContent("Seu valor: Meu nome");
    expect(nome).toHaveTextContent("Valor atual: Nome da outra pessoa");
    const agenda = within(dialog).getByText("Editar e cancelar aulas").closest("li")!;
    expect(agenda).toHaveTextContent("Seu valor: Não");
    expect(agenda).toHaveTextContent("Valor atual: Sim");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(2);
    expect(within(dialog).getByRole("button", { name: "Recarregar" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Sobrescrever" })).toBeInTheDocument();
  });

  it("CA4: Recarregar preenche o formulário com o atual, fecha e deixa o Salvar desabilitado", async () => {
    const user = userEvent.setup();
    conflicting();
    await ready("Unidade Nome da outra pessoa");
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Meu nome");
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    await user.click(await within(dialog).findByRole("button", { name: "Recarregar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByLabelText("Nome")).toHaveValue("Nome da outra pessoa");
    expect(save()).toBeDisabled();
  });

  it("CA4: Sobrescrever regrava com a versão atual e mostra Salvo", async () => {
    const user = userEvent.setup();
    const { sent } = conflicting([409, 200]);
    await ready("Unidade Nome da outra pessoa");
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Meu nome");
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    await user.click(await within(dialog).findByRole("button", { name: "Sobrescrever" }));
    expect(await screen.findByText("Salvo")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(sent.map((s) => s.version)).toEqual(["3", "3"]);
    expect(sent[1]?.body.name).toBe("Meu nome");
    expect(screen.getByLabelText("Nome")).toHaveValue("Meu nome");
  });

  it("CA4: novo 409 durante o Sobrescrever reabre o aviso", async () => {
    const user = userEvent.setup();
    const { sent, reads } = conflicting([409, 409]);
    await ready("Unidade Nome da outra pessoa");
    await user.type(screen.getByLabelText("Nome"), "!");
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    await user.click(await within(dialog).findByRole("button", { name: "Sobrescrever" }));
    await waitFor(() => expect(sent).toHaveLength(2));
    await waitFor(() => expect(reads.count).toBe(3));
    expect(await within(screen.getByRole("dialog")).findByRole("button", { name: "Sobrescrever" })).toBeEnabled();
    expect(screen.queryByText("Salvo")).not.toBeInTheDocument();
  });

  it("CA4: erro de rede na consulta do estado atual mostra o erro com 'Tentar de novo'", async () => {
    const user = userEvent.setup();
    conflicting();
    await ready("Unidade Nome da outra pessoa");
    await user.type(screen.getByLabelText("Nome"), "!");
    server.use(http.get("/api/v1/units/:id", () => HttpResponse.error(), { once: true }));
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    expect(await within(dialog).findByText("Não foi possível consultar o estado atual. Nada foi alterado.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Tentar de novo" }));
    expect(await within(dialog).findByRole("button", { name: "Sobrescrever" })).toBeInTheDocument();
  });

  it("CA4: o conflito lista Lembretes automáticos e Horário de envio", async () => {
    const user = userEvent.setup();
    conflicting();
    await ready("Unidade Nome da outra pessoa");
    stored[A] = { ...stored[A]!, settings: { ...stored[A]!.settings, remindersEnabled: false, remindersHour: 14 } };
    await user.type(screen.getByLabelText("Nome"), "!");
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    const on = (await within(dialog).findByText("Lembretes automáticos")).closest("li")!;
    expect(on).toHaveTextContent("Seu valor: Sim");
    expect(on).toHaveTextContent("Valor atual: Não");
    expect(within(dialog).getByText("Horário de envio").closest("li")).toHaveTextContent("Valor atual: 14");
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA4: a janela de conflito a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    conflicting();
    await ready("Unidade Nome da outra pessoa");
    await user.type(screen.getByLabelText("Nome"), "!");
    await user.click(save());
    const dialog = await screen.findByRole("dialog", { name: DIALOG });
    await within(dialog).findByRole("button", { name: "Sobrescrever" });
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
