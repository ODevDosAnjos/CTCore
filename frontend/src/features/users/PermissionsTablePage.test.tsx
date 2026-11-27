import { render, screen, within } from "@testing-library/react";
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

function setup(role = "COORDINATOR", path = "/configuracoes/unidades/u1/permissoes", reach: { id: string }[] = []) {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: reach })),
    http.get("/api/v1/users", () => HttpResponse.json([])),
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

const ready = () => screen.findByRole("heading", { name: "Tabela de permissões", level: 1 });

describe("PermissionsTablePage", () => {
  it("CA8: título sem subtítulo, legenda e a matriz de 29 linhas com as três colunas", async () => {
    setup();
    await ready();
    expect(screen.queryByText("Fixa: não existe edição de perfis")).not.toBeInTheDocument();
    expect(screen.getByText(/● pode · ○ só consulta/)).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Área ou ação", "Coordenador", "Administrador", "Professor"]);
    expect(within(table).getAllByRole("row")).toHaveLength(30);
    const linha = within(table).getByRole("row", { name: /Dias sem aula/ });
    expect(within(linha).getByText("● várias unidades")).toBeInTheDocument();
  });

  it("CA11 (#611): a linha Administradores é ● — — e Voltar à unidade aponta para Configurações › Unidade", async () => {
    setup();
    await ready();
    expect(screen.getByRole("link", { name: "Voltar à unidade" })).toHaveAttribute("href", "/configuracoes/unidades/u1");
    const linha = within(screen.getByRole("table")).getByRole("row", { name: /^Administradores/ });
    expect(within(linha).getAllByRole("cell").map((c) => c.textContent)).toEqual(["●", "—", "—"]);
  });

  // Com duas unidades o Coordenador começa em "Todas as unidades": a tabela usa a primeira ao alcance (#746, D7).
  it.each(["/configuracoes/usuarios/permissoes", "/configuracoes/unidade/permissoes"])("CA10 (#611) e #746 CA7: o endereço antigo %s leva à nova tabela", async (path) => {
    setup("COORDINATOR", path, [{ id: "u1" }, { id: "u2" }]);
    await ready();
    expect(screen.getByRole("link", { name: "Voltar à unidade" })).toHaveAttribute("href", "/configuracoes/unidades/u1");
  });

  it("CA10: a 360 px cada linha vira um bloco, sem tabela", async () => {
    setDeviceNarrow(true);
    setup();
    await ready();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getAllByRole("definition")).toHaveLength(29 * 3);
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
