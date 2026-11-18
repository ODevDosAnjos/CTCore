import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
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

function setup(role = "COORDINATOR") {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [] })),
    http.get("/api/v1/users", () => HttpResponse.json([])),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/configuracoes/usuarios/permissoes"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Tabela de permissões", level: 1 });

describe("PermissionsTablePage", () => {
  it("CA8: título, subtítulo, legenda e a matriz de 28 linhas com as três colunas", async () => {
    setup();
    await ready();
    expect(screen.getByText("Fixa: não existe edição de perfis")).toBeInTheDocument();
    expect(screen.getByText(/● pode · ○ só consulta/)).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Área ou ação", "Coordenador", "Administrador", "Professor"]);
    expect(within(table).getAllByRole("row")).toHaveLength(29);
    const linha = within(table).getByRole("row", { name: /Dias sem aula/ });
    expect(within(linha).getByText("● várias unidades")).toBeInTheDocument();
  });

  it("CA8: Voltar aos usuários leva à lista", async () => {
    const u = userEvent.setup();
    setup();
    await ready();
    await u.click(screen.getByRole("link", { name: "Voltar aos usuários" }));
    expect(await screen.findByRole("heading", { name: "Usuários", level: 1 })).toBeInTheDocument();
  });

  it("CA10: a 360 px cada linha vira um bloco, sem tabela", async () => {
    setDeviceNarrow(true);
    setup();
    await ready();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("definition")).toHaveLength(28 * 3);
    expect(screen.getByText("Início da unidade")).toBeInTheDocument();
  });

  it("CA11: o Professor não tem acesso", async () => {
    setup("TEACHER");
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Tabela de permissões" })).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA11: sem violações no axe no tema %s, na tela larga e a 360 px", async (_n, dark) => {
    setDevicePrefersDark(dark);
    const { container, unmount } = setup();
    await ready();
    expect(await axeViolations(container)).toEqual([]);
    unmount();
    setDeviceNarrow(true, dark);
    const narrow = setup();
    await ready();
    expect(await axeViolations(narrow.container)).toEqual([]);
  });
});
