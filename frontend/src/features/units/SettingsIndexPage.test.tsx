import { render, screen, within } from "@testing-library/react";
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

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});

function setup(role: string) {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: role === "COORDINATOR", units: [] })),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/configuracoes"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
const list = async () => {
  await screen.findByRole("heading", { name: "Configurações", level: 1 });
  return within(screen.getByRole("main"));
};

describe("SettingsIndexPage (R8, GMConfig)", () => {
  it("CA17: o Coordenador vê os links permitidos, na ordem do menu, com Assinatura Em breve (#746) e Dados e segurança com tela (#628)", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    const items = await list();
    expect(items.getAllByRole("link").map((a) => a.textContent)).toEqual([
      "Organização", "Unidades", "Assinatura", "Dados e segurança",
    ]);
    expect(items.getByRole("link", { name: "Unidades" })).toHaveAttribute("href", "/configuracoes/unidades");
    expect(items.getByRole("link", { name: "Organização" })).toHaveAttribute("href", "/configuracoes/organizacao");
    expect(items.getByRole("link", { name: "Dados e segurança" })).toHaveAttribute("href", "/configuracoes/dados-e-seguranca");
    const soon = items.getByRole("link", { name: "Assinatura" });
    expect(soon).toHaveAttribute("aria-disabled", "true");
    await user.click(soon);
    expect(screen.getByRole("heading", { name: "Configurações", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("Assinatura e Unidades aparecem só para o Coordenador.")).not.toBeInTheDocument();
    await user.click(items.getByRole("link", { name: "Organização" }));
    expect(screen.queryByRole("heading", { name: "Configurações", level: 1 })).not.toBeInTheDocument();
  });

  it("CA17: o Administrador vê a lista filtrada pela permissão, sem a nota sobre Assinatura e Unidades", async () => {
    setup("ADMINISTRATOR");
    const items = await list();
    expect(items.getByRole("link", { name: "Organização" })).toBeInTheDocument();
    expect(screen.queryByText("Assinatura e Unidades aparecem só para o Coordenador.")).not.toBeInTheDocument();
    expect(items.queryByText("Assinatura")).not.toBeInTheDocument();
    expect(items.getByRole("link", { name: "Unidades" })).toBeInTheDocument();
    expect(items.getByRole("link", { name: "Dados e segurança" })).toHaveAttribute("aria-disabled", "true");
  });

  it("CA17: o Professor recebe a tela de área indisponível", async () => {
    setup("TEACHER");
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
  });

  it("CA18: erro ao ler as permissões mostra Tentar de novo", async () => {
    server.use(http.get("/api/v1/permissions", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    setup("COORDINATOR");
    server.use(http.get("/api/v1/permissions", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    expect((await screen.findAllByRole("button", { name: "Tentar de novo" })).length).toBeGreaterThan(0);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA18: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("ADMINISTRATOR");
    await list();
    expect(await axeViolations(container)).toEqual([]);
  });
});
