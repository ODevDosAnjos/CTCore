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

const session = (role: string, twoFactor: boolean): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: twoFactor, required: false },
});
const view = {
  name: "Academia Alfa",
  color: null,
  holderDocument: null,
  logoUrl: null,
  version: 0,
  lastChange: null,
  rules: { deactivationDays: 30, formerStudentRetentionMonths: 12, trialRetentionMonths: 6, trialLimit: 2, crossUnitTraining: "plan" },
  coordinator: { name: "Marcos Leão", email: "marcos@academialeao.example", twoFactorEnabled: true },
};
const staff = (over: Record<string, unknown>) => ({
  linkId: "x",
  name: "Fulano",
  email: "fulano@alfa.test",
  role: "ADMINISTRATOR",
  units: [],
  lastAccessAt: null,
  status: "ACTIVE",
  canManage: true,
  ...over,
});
const CARLA = staff({ linkId: "l-carla", name: "Carla Mendes", email: "carla@alfa.test", units: [{ id: "u1", name: "Tijuca" }, { id: "u2", name: "Barra" }] });
const USERS = [
  CARLA,
  staff({ linkId: "l-bruno", name: "Bruno Alves", email: "bruno@alfa.test", units: [{ id: "u1", name: "Tijuca" }], status: "PENDING" }),
  staff({ linkId: "l-diego", name: "Diego Souza", email: "diego@alfa.test", role: "TEACHER", units: [{ id: "u1", name: "Tijuca" }] }),
];

let role: string;
let reauths: unknown[];
let transfers: { token: string | null; body: unknown }[];
type Handler = () => Response | Promise<Response>;

function setup({ users = USERS as unknown[], twoFactor = true, reauth, transfer, usersHandler }: { users?: unknown[]; twoFactor?: boolean; reauth?: Handler; transfer?: Handler; usersHandler?: Handler } = {}) {
  role = "COORDINATOR";
  reauths = [];
  transfers = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role, twoFactor))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
    http.get("/api/v1/organization", () => HttpResponse.json(view)),
    http.get("/api/v1/users", usersHandler ?? (() => HttpResponse.json(users))),
    http.post("/api/v1/auth/reauth", async ({ request }) => {
      reauths.push(await request.json());
      return reauth ? reauth() : HttpResponse.json({ reauthToken: "tok", expiresAt: "2030-01-01T00:00:00Z" });
    }),
    http.post("/api/v1/organization/coordination-transfer", async ({ request }) => {
      transfers.push({ token: request.headers.get("X-Reauth-Token"), body: await request.json() });
      if (transfer) return transfer();
      role = "ADMINISTRATOR";
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/configuracoes/organizacao"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

type User = ReturnType<typeof userEvent.setup>;
const open = async (user: User) => {
  await user.click(await screen.findByRole("button", { name: "Transferir coordenação" }));
  const dialog = await screen.findByRole("dialog", { name: "Transferir coordenação" });
  await within(dialog).findByLabelText("Novo Coordenador");
  return dialog;
};
const submitButton = (dialog: HTMLElement) => within(dialog).getByRole("button", { name: "Transferir coordenação" });
const fill = async (user: User, dialog: HTMLElement, { word = "transferir", password = "segredo123", code = "123456", pick = true } = {}) => {
  if (pick) await user.selectOptions(within(dialog).getByLabelText("Novo Coordenador"), "l-carla");
  await user.type(within(dialog).getByLabelText("Digite TRANSFERIR"), word);
  await user.type(within(dialog).getByLabelText("Sua senha"), password);
  const field = within(dialog).queryByLabelText("Código de duas etapas");
  if (field) await user.type(field, code);
};

describe("TransferCoordinationDialog (RF-ORG-06, R9, R10)", () => {
  it("CA9: abre com o texto, o seletor só com Administradores ativos, o Resumo com o nome escolhido e o botão desabilitado", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await open(user);
    expect(within(dialog).getByText("Só existe um Coordenador por organização. Depois da transferência, você vira Administrador de todas as unidades.")).toBeInTheDocument();
    const options = within(dialog).getAllByRole("option").map((o) => o.textContent);
    expect(options).toEqual(["Escolha um Administrador", "Carla Mendes · Administrador · Tijuca e Barra"]);
    expect(within(dialog).getByText("Resumo")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
    expect(submitButton(dialog)).toBeDisabled();
    await user.selectOptions(within(dialog).getByLabelText("Novo Coordenador"), "l-carla");
    const items = within(dialog).getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toContain("Carla recebe um e-mail para confirmar");
    expect(items[1]).toContain("passam para Carla");
    expect(items[2]).toContain("Você continua com acesso como Administrador");
  });

  it("CA9: sem Administrador ativo o seletor mostra Nenhum Administrador ativo e o botão não habilita", async () => {
    const user = userEvent.setup();
    setup({ users: [USERS[1], USERS[2]] });
    const dialog = await open(user);
    expect(within(dialog).getByRole("option", { name: "Nenhum Administrador ativo" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Novo Coordenador")).toBeDisabled();
    await fill(user, dialog, { pick: false });
    expect(submitButton(dialog)).toBeDisabled();
  });

  it("CA10: o botão só habilita com Administrador, a palavra (com espaços e minúsculas), a senha e o código", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await open(user);
    await user.type(within(dialog).getByLabelText("Digite TRANSFERIR"), "errado");
    await user.type(within(dialog).getByLabelText("Sua senha"), "segredo123");
    await user.type(within(dialog).getByLabelText("Código de duas etapas"), "123456");
    expect(submitButton(dialog)).toBeDisabled();
    await user.selectOptions(within(dialog).getByLabelText("Novo Coordenador"), "l-carla");
    expect(submitButton(dialog)).toBeDisabled();
    await user.clear(within(dialog).getByLabelText("Digite TRANSFERIR"));
    await user.type(within(dialog).getByLabelText("Digite TRANSFERIR"), " transferir ");
    expect(submitButton(dialog)).toBeEnabled();
    await user.clear(within(dialog).getByLabelText("Código de duas etapas"));
    expect(submitButton(dialog)).toBeDisabled();
    await user.clear(within(dialog).getByLabelText("Sua senha"));
    await user.type(within(dialog).getByLabelText("Código de duas etapas"), "123456");
    expect(submitButton(dialog)).toBeDisabled();
  });

  it("CA10: sem duas etapas o campo de código não existe e a reautenticação não leva código", async () => {
    const user = userEvent.setup();
    setup({ twoFactor: false });
    const dialog = await open(user);
    expect(within(dialog).queryByLabelText("Código de duas etapas")).not.toBeInTheDocument();
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    expect(await screen.findByText("Coordenação transferida.")).toBeInTheDocument();
    expect(reauths).toEqual([{ action: "TRANSFER_COORDINATION", password: "segredo123" }]);
  });

  it("CA11: confirma com reautenticação e transferência no mesmo clique; sucesso fecha, recarrega a sessão e avisa", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    expect(await screen.findByText("Coordenação transferida.")).toBeInTheDocument();
    expect(reauths).toEqual([{ action: "TRANSFER_COORDINATION", password: "segredo123", code: "123456" }]);
    expect(transfers).toEqual([{ token: "tok", body: { email: "carla@alfa.test", confirmation: "transferir" } }]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Transferir coordenação" })).not.toBeInTheDocument();
  });

  it("CA11: senha errada aparece no campo da senha e a transferência não é chamada; código errado, no campo do código", async () => {
    const user = userEvent.setup();
    let apiCode = "INVALID_CREDENTIALS";
    setup({ reauth: () => HttpResponse.json({ code: apiCode, message: "x", changed: false, fields: [], traceId: "t" }, { status: 401 }) });
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    expect(await within(dialog).findByText("Senha incorreta.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Sua senha")).toHaveAttribute("aria-invalid", "true");
    expect(transfers).toEqual([]);
    apiCode = "INVALID_TWO_FACTOR_CODE";
    await user.click(submitButton(dialog));
    expect(await within(dialog).findByText("Código incorreto.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Código de duas etapas")).toHaveAttribute("aria-invalid", "true");
    expect(transfers).toEqual([]);
  });

  it("CA12: 429 mostra a mensagem de excesso, tanto na confirmação quanto na transferência", async () => {
    const user = userEvent.setup();
    let reauthStatus = 429;
    setup({
      reauth: () => (reauthStatus === 429 ? HttpResponse.json({ code: "TOO_MANY_REQUESTS" }, { status: 429 }) : HttpResponse.json({ reauthToken: "tok", expiresAt: "2030-01-01T00:00:00Z" })),
      transfer: () => HttpResponse.json({ code: "TOO_MANY_REQUESTS" }, { status: 429 }),
    });
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    expect(await within(dialog).findByText("Muitas tentativas. Aguarde um pouco e tente de novo.")).toBeInTheDocument();
    expect(transfers).toEqual([]);
    reauthStatus = 200;
    await user.click(submitButton(dialog));
    await waitFor(() => expect(transfers).toHaveLength(1));
    expect(await within(dialog).findByText("Muitas tentativas. Aguarde um pouco e tente de novo.")).toBeInTheDocument();
  });

  it("CA12: 400 do servidor aponta o campo (Administrador e palavra)", async () => {
    const user = userEvent.setup();
    setup({
      transfer: () =>
        HttpResponse.json(
          { code: "VALIDATION_ERROR", fields: [{ field: "email", message: "x" }, { field: "confirmation", message: "y" }] },
          { status: 400 },
        ),
    });
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    expect(await within(dialog).findByText("Escolha um Administrador ativo da organização.")).toBeInTheDocument();
    expect(within(dialog).getByText("Digite TRANSFERIR para confirmar.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Novo Coordenador")).toHaveAttribute("aria-invalid", "true");
  });

  it("CA12: 403 mostra o estado sem permissão", async () => {
    const user = userEvent.setup();
    setup({ transfer: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    expect(await within(dialog).findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA12: falha de rede mostra o erro com Tentar de novo, que repete a sequência", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup({ transfer: () => (fail ? HttpResponse.error() : new HttpResponse(null, { status: 204 })) });
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    await user.click(await within(dialog).findByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(reauths).toHaveLength(2));
    fail = false;
    await user.click(await within(dialog).findByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(transfers).toHaveLength(3));
  });

  it("CA12: com o envio em andamento a janela não fecha (Cancelar desabilitado e Esc ignorado)", async () => {
    const user = userEvent.setup();
    setup({ reauth: () => new Promise<Response>(() => {}) });
    const dialog = await open(user);
    await fill(user, dialog);
    await user.click(submitButton(dialog));
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled());
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "Transferir coordenação" })).toBeInTheDocument();
  });

  it("CA14: carregando a lista e erro ao carregar com Tentar de novo", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup({ usersHandler: () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(USERS)) });
    await user.click(await screen.findByRole("button", { name: "Transferir coordenação" }));
    const dialog = await screen.findByRole("dialog", { name: "Transferir coordenação" });
    const retry = await within(dialog).findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await within(dialog).findByLabelText("Novo Coordenador")).toBeInTheDocument();
  });

  it("CA14: lista com 403 mostra sem permissão", async () => {
    const user = userEvent.setup();
    setup({ usersHandler: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    await user.click(await screen.findByRole("button", { name: "Transferir coordenação" }));
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA7: Administrador não vê o botão", async () => {
    setup();
    role = "ADMINISTRATOR";
    expect(await screen.findByRole("heading", { name: "Organização", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Transferir coordenação" })).not.toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA14: a 360 px, sem violações no axe no tema %s, na tela e na janela", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findByRole("button", { name: "Transferir coordenação" });
    expect(await axeViolations(container)).toEqual([]);
    const dialog = await open(user);
    await user.selectOptions(within(dialog).getByLabelText("Novo Coordenador"), "l-carla");
    expect(await axeViolations(dialog)).toEqual([]);
  });
});
