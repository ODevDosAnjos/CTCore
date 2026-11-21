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

const link = (id: string, role: string) => ({ id, organizationId: "o", organizationName: "Alfa", role, unitIds: [] });
const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [link("l1", role)],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});

function setup(role: string, permissions?: () => Response | Promise<Response>, path = "/") {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", permissions ?? (() => HttpResponse.json({ permissions: mockPermissions(role) }))),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("ManagementShell", () => {
  it("CA13: carregando mostra o estado de carregamento", async () => {
    setup("COORDINATOR", () => new Promise<Response>(() => {}));
    expect(await screen.findByRole("status")).toHaveTextContent(/carregando/i);
  });

  it("CA13: erro mostra Tentar de novo e a nova tentativa monta o menu", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup("COORDINATOR", () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ permissions: mockPermissions("COORDINATOR") })));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect((await screen.findAllByRole("link", { name: "Início", hidden: true })).length).toBeGreaterThan(0);
  });

  it("CA13: perfil sem nenhuma área mostra a tela de área indisponível", async () => {
    setup("TEACHER", () => HttpResponse.json({ permissions: mockPermissions("STUDENT") }));
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
  });

  it("R7: Professor e Coordenador veem o menu com o Início e o conteúdo da tela", async () => {
    setup("TEACHER");
    const nav = await screen.findByRole("navigation", { name: "Menu principal", hidden: true });
    expect(within(nav).getByRole("link", { name: "Início", hidden: true })).toHaveAttribute("aria-current", "page");
    expect(within(nav).queryByText("Financeiro")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeInTheDocument();
  });

  it("CA1/CA2/CA6: organização, área, contador de Pedidos e conta no desktop", async () => {
    server.use(http.get("/api/v1/portal-requests", () => HttpResponse.json({ items: [], total: 3 })));
    window.innerWidth = 1440;
    setup("COORDINATOR");
    expect(await screen.findByText("Gestão · Coordenador")).toBeInTheDocument();
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Pessoas" }));
    await waitFor(() => expect(screen.getByRole("link", { name: "Pedidos" })).toHaveTextContent("3"));
    const conta = screen.getByRole("button", { name: /Menu da conta/ });
    expect(conta).toHaveTextContent("Coordenador");
    await userEvent.setup().click(conta);
    expect(screen.getByRole("menuitem", { name: "Minha conta" })).toHaveAttribute("href", "/conta");
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA14: sem violações no axe a 1440 px no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 1440;
    const { container } = setup("COORDINATOR");
    await screen.findByRole("heading", { name: "Bem-vindo ao ctcore" });
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA13: a 360 px o menu abre pelo botão", async () => {
    const user = userEvent.setup();
    window.innerWidth = 360;
    setup("COORDINATOR");
    await user.click(await screen.findByRole("button", { name: "Menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: sem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR");
    await screen.findByRole("heading", { name: "Bem-vindo ao ctcore" });
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA7/CA12: 'Sair da conta' no menu da conta (desktop) e no menu do celular chamam POST /auth/logout", async () => {
    let n = 0;
    server.use(http.post("/api/v1/auth/logout", () => ((n += 1), new HttpResponse(null, { status: 204 }))));
    const user = userEvent.setup();
    setup("COORDINATOR");
    await screen.findByRole("heading", { name: "Bem-vindo ao ctcore" });
    expect(screen.queryByRole("button", { name: "Sair da conta" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Menu da conta/ }));
    await user.click(screen.getByRole("menuitem", { name: "Sair da conta" }));
    await waitFor(() => expect(n).toBe(1));
  });

  it("CA12: o menu do celular tem o seletor de unidade, o tema, Minha conta e Sair", async () => {
    server.use(http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [{ id: "u1", name: "Tijuca", shortName: "t" }] })));
    const user = userEvent.setup();
    setup("COORDINATOR");
    await user.click(await screen.findByRole("button", { name: "Menu" }));
    const menu = screen.getByRole("dialog", { name: "Menu" });
    expect(await within(menu).findByText("Tijuca")).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Minha conta" })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: "Sair da conta" })).toBeInTheDocument();
  });

  // RNF-43: a moldura é a rota-pai; navegar só troca a área central.
  describe("moldura fixa na rota (#675)", () => {
    const menu = () => screen.getByRole("navigation", { name: "Menu principal", hidden: true });
    const go = (name: string) => userEvent.setup().click(within(menu()).getByRole("link", { name, hidden: true }));

    it("CA1/CA2: menu, barra e grupo aberto continuam os mesmos e /permissions é lido uma vez", async () => {
      let reads = 0;
      window.innerWidth = 1440;
      setup("COORDINATOR", () => (reads++, HttpResponse.json({ permissions: mockPermissions("COORDINATOR") })));
      await screen.findByRole("heading", { name: "Bem-vindo ao ctcore" });
      const nav = menu();
      const top = document.querySelector("header");
      await userEvent.setup().click(within(nav).getByRole("button", { name: "Pessoas", hidden: true }));
      await go("Alunos");
      expect(await screen.findByRole("heading", { name: "Alunos" })).toBeInTheDocument();
      expect(within(menu()).getByRole("link", { name: "Alunos", hidden: true })).toHaveAttribute("aria-current", "page");
      await go("Pedidos");
      await screen.findByRole("heading", { name: "Pedidos" });
      await go("Início");
      await screen.findByRole("heading", { name: "Bem-vindo ao ctcore" });
      expect(menu()).toBe(nav);
      expect(document.querySelector("header")).toBe(top);
      expect(within(nav).getByRole("link", { name: "Pedidos", hidden: true })).toBeInTheDocument();
      expect(reads).toBe(1);
    });

    it("CA3: com a tela atrasada, a moldura fica e o carregando aparece só na área central", async () => {
      window.innerWidth = 1440;
      server.use(http.get("/api/v1/students", async () => (await new Promise(() => {}), HttpResponse.json({}))));
      setup("COORDINATOR");
      await screen.findByRole("heading", { name: "Bem-vindo ao ctcore" });
      const nav = menu();
      await userEvent.setup().click(within(nav).getByRole("button", { name: "Pessoas", hidden: true }));
      await go("Alunos");
      expect(await within(screen.getByRole("main")).findByRole("status")).toHaveTextContent(/carregando/i);
      expect(menu()).toBe(nav);
    });

    it("CA5/CA13: sem a chave do servidor mostra 'sem acesso' dentro da moldura, sem item marcado e sem chamar a tela", async () => {
      let calls = 0;
      server.use(http.get("/api/v1/announcements", () => (calls++, HttpResponse.json({ items: [], total: 0 }))));
      setup("TEACHER", () => HttpResponse.json({ permissions: { ...mockPermissions("TEACHER"), ANNOUNCEMENTS: "NONE" } }), "/comunicados");
      expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
      expect(menu()).toBeInTheDocument();
      expect(within(menu()).queryAllByRole("link", { hidden: true }).filter((l) => l.getAttribute("aria-current") === "page")).toEqual([]);
      expect(calls).toBe(0);
      // Celular (D7): o Início fica marcado na aba e no cabeçalho, sem seta de voltar, como no canvas SemAcessoM.
      const tabs = screen.getByRole("navigation", { name: "Abas principais", hidden: true });
      expect(within(tabs).getByRole("link", { name: "Início", hidden: true })).toHaveAttribute("aria-current", "page");
      const header = document.querySelector("header") as HTMLElement;
      expect(within(header).queryByRole("link", { name: "Voltar ao Início", hidden: true })).toBeNull();
      expect(within(header).getByText("Início")).toBeInTheDocument();
    });

    it("CA5: Administrador sem Organização vê 'sem acesso' em /configuracoes/organizacao", async () => {
      setup("ADMINISTRATOR", () => HttpResponse.json({ permissions: { ...mockPermissions("ADMINISTRATOR"), ORGANIZATION_SETTINGS: "NONE" } }), "/configuracoes/organizacao");
      expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
    });

    it("CA6: o endereço antigo /planos/lista chega a /planos dentro da moldura", async () => {
      setup("COORDINATOR", undefined, "/planos/lista");
      expect(await screen.findByRole("heading", { name: "Planos e benefícios" })).toBeInTheDocument();
      expect(within(menu()).getByRole("link", { name: "Planos", hidden: true })).toHaveAttribute("aria-current", "page");
    });
  });
});
