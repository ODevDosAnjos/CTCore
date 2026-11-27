import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";

const POLICY = "/api/v1/organization/admin-two-factor";
const send = (method: string, path: string, body?: unknown) =>
  fetch(`/api/v1${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
const login = (email: string) => send("POST", "/auth/login", { email, password: "x" });
const err = (status: number) => HttpResponse.json({ code: status === 403 ? "FORBIDDEN" : "INTERNAL_ERROR" }, { status });
const stored = async () => (await (await fetch(POLICY)).json()).required as boolean;

const open = (url = "/configuracoes/dados-e-seguranca") =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[url]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
const toggle = () => screen.findByRole("switch", { name: "Exigir duas etapas dos Administradores" });

describe("Dados e segurança › Duas etapas (#628)", () => {
  beforeEach(() => login("ana@exemplo.com"));

  it("CA10: Duas etapas ativa e as outras abas Em breve, que clique, teclado e ?aba não abrem", async () => {
    const user = userEvent.setup();
    open("/configuracoes/dados-e-seguranca?aba=auditoria");
    await toggle();
    expect(screen.getByRole("heading", { level: 1, name: "Dados e segurança" })).toBeInTheDocument();
    const tabs = within(screen.getByRole("tablist", { name: "Seções de Dados e segurança" })).getAllByRole("tab");
    expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["false", "false", "false", "true"]);
    for (const [i, name] of ["Auditoria", "Importar e exportar", "Acesso do suporte"].entries()) {
      expect(tabs[i]).toHaveAccessibleName(name);
      expect(tabs[i]).toHaveAttribute("aria-disabled", "true");
      expect(tabs[i]).toHaveAccessibleDescription("Disponível em uma próxima versão");
      expect(tabs[i]).toHaveTextContent("Em breve");
      await user.click(tabs[i]);
      expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    }
    tabs[3].focus();
    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();
    expect(tabs[3]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("CA10: ligar pede confirmação (cancelar não grava) e desligar grava direto, com a última alteração", async () => {
    const user = userEvent.setup();
    open();
    expect(await toggle()).not.toBeChecked();
    expect(screen.getByText("Ainda sem alterações")).toBeInTheDocument();

    await user.click(await toggle());
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    expect(await stored()).toBe(false);

    await user.click(await toggle());
    expect(screen.getByRole("dialog")).toHaveTextContent("são desconectados agora e configuram no próximo login");
    await user.click(screen.getByRole("button", { name: "Exigir duas etapas" }));
    await waitFor(() => expect(screen.getByRole("switch")).toBeChecked());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Exigência ligada.")).toBeInTheDocument();
    expect(screen.getByText(/Última alteração em .* por Ana/)).toBeInTheDocument();
    expect(await stored()).toBe(true);

    await user.click(screen.getByRole("switch"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("switch")).not.toBeChecked());
    expect(await stored()).toBe(false);
  });

  it("CA11: carregando, erro com Tentar de novo e sem permissão", async () => {
    const user = userEvent.setup();
    server.use(http.get(POLICY, () => err(500), { once: true }));
    const first = open();
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await toggle()).toBeInTheDocument();
    first.unmount();

    server.use(http.get(POLICY, () => new Promise<never>(() => {})));
    const loading = open();
    await screen.findByRole("tablist", { name: "Seções de Dados e segurança" });
    expect(within(screen.getByRole("tabpanel")).getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    loading.unmount();

    server.use(http.get(POLICY, () => err(403)));
    open();
    await screen.findByRole("tablist", { name: "Seções de Dados e segurança" });
    await waitFor(() => expect(screen.getByRole("tabpanel")).toHaveTextContent("Você não tem acesso"));
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("CA11: falha ao salvar mostra o erro e o interruptor fica no valor anterior, ao ligar e ao desligar", async () => {
    const user = userEvent.setup();
    server.use(http.put(POLICY, () => err(500)));
    const first = open();
    await user.click(await toggle());
    await user.click(screen.getByRole("button", { name: "Exigir duas etapas" }));
    const dialog = screen.getByRole("dialog");
    expect(await within(dialog).findByText("Não foi possível salvar. Tente de novo.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("switch")).not.toBeChecked();
    first.unmount();

    server.use(http.get(POLICY, () => HttpResponse.json({ required: true, lastChange: null })));
    open();
    await user.click(await toggle());
    expect(await screen.findByText("Não foi possível salvar. Tente de novo.")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA11: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = open();
    await toggle();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA12: o Administrador que digita o endereço vê que a área não é do perfil", async () => {
    await login("admin@exemplo.com");
    open();
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
  });

  it("CA5 e CA7: exigido pela organização, o Administrador é barrado com o texto dela e sem Agora não", async () => {
    await send("PUT", "/organization/admin-two-factor", { required: true });
    await login("admin@exemplo.com");
    open("/alunos");
    expect(await screen.findByRole("heading", { name: "Ative as duas etapas para continuar" })).toBeInTheDocument();
    expect(screen.getByText("A sua organização exige a verificação em duas etapas dos Administradores. Ative para usar o sistema.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agora não" })).not.toBeInTheDocument();
  });

  it("CA5: o Coordenador obrigado segue com o texto do perfil", async () => {
    await login("coord@exemplo.com");
    open("/alunos");
    expect(await screen.findByText("O perfil de Coordenador exige a verificação em duas etapas. Ative para usar o sistema.")).toBeInTheDocument();
  });

  it("CA7: em Minha conta, o Administrador obrigado com as duas etapas ligadas não vê Desligar", async () => {
    await send("PUT", "/organization/admin-two-factor", { required: true });
    await login("admin@exemplo.com");
    await send("POST", "/auth/two-factor/enable", { code: "123456" });
    open("/conta?aba=seguranca");
    expect(await screen.findByRole("heading", { name: "Verificação em duas etapas" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Desligar/ })).not.toBeInTheDocument();
  });
});
