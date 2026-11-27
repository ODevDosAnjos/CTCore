import { render, screen, waitFor } from "@testing-library/react";
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
  account: { id: "a", email: "x@x.com", name: "Ana Silva" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});

function setup(role: string, path = "/endereco-que-nao-existe") {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/portal/term", () => HttpResponse.json([])),
    http.get("/api/v1/portal/shell", () => HttpResponse.json({ organization: { name: "Academia Alfa", logoUrl: null }, reduced: false, unreadAnnouncements: 0 })),
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
const TITLE = "Página não encontrada";

describe("NotFoundPage (#675, CA7)", () => {
  it("gestão: aparece dentro da moldura, com o menu e sem item marcado, e o botão leva ao Início", async () => {
    setup("COORDINATOR");
    expect(await screen.findByRole("heading", { level: 1, name: TITLE })).toBeInTheDocument();
    const menu = screen.getByRole("navigation", { name: "Menu principal" });
    expect(menu.querySelector("[aria-current=page]")).toBeNull();
    expect(screen.getByRole("link", { name: "Ir para o Início" })).toHaveAttribute("href", "/");
  });

  it("portal: aparece dentro da barra do portal", async () => {
    setup("STUDENT");
    expect(await screen.findByRole("heading", { level: 1, name: TITLE })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Portal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o Início" })).toHaveAttribute("href", "/");
  });

  it("sem sessão vai ao acesso (D3)", async () => {
    server.use(http.get("/api/v1/auth/session", () => HttpResponse.json({ code: "UNAUTHENTICATED", message: "m", changed: false, fields: [], traceId: "t" }, { status: 401 })));
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/endereco-que-nao-existe"]}>
          <SessionProvider>
            <App />
          </SessionProvider>
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: TITLE })).not.toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA12: axe a 360 px no tema %s, com foco no título", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup("TEACHER");
    const h1 = await screen.findByRole("heading", { name: TITLE });
    await waitFor(() => expect(h1).toHaveFocus());
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
