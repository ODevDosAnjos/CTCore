import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { AppRoute } from "@/routes";
import { RequireArea } from "./RequireArea";
import { RequireSession } from "./RequireSession";
import { SessionProvider, type SessionView } from "./SessionProvider";

const L = (id: string, role: string) => ({ id, organizationId: "o", organizationName: "Alfa", role, unitIds: [] });
const account = { id: "a", email: "x@x.com", name: "X" };
const off = { enabled: false, required: false };
const TITLE = "Esta área não está disponível para o seu perfil";

const route: AppRoute = { id: "x", path: "/financeiro", area: "management", roles: ["COORDINATOR", "ADMINISTRATOR"] };

function Path() {
  return <span data-testid="path">{useLocation().pathname}</span>;
}
function setup(view: SessionView | Response) {
  server.use(
    http.get("/api/v1/auth/session", () => (view instanceof Response ? view : HttpResponse.json(view))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(view instanceof Response ? undefined : view.links.find((l) => l.id === view.activeLinkId)?.role) })),
  );
  return render(
    <ThemeProvider>
    <MemoryRouter initialEntries={["/financeiro"]}>
      <SessionProvider>
        <Path />
        <Routes>
          <Route element={<RequireSession />}>
            <Route path="/financeiro" element={<RequireArea route={route}><p>conteudo protegido</p></RequireArea>} />
          </Route>
        </Routes>
      </SessionProvider>
    </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("RequireArea", () => {
  it("CA2: professor vê a tela, a URL não muda e o conteúdo não renderiza", async () => {
    setup({ account, links: [L("l1", "TEACHER")], activeLinkId: "l1", twoFactor: off });
    expect(await screen.findByRole("heading", { name: TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("path")).toHaveTextContent("/financeiro");
    expect(screen.queryByText("conteudo protegido")).not.toBeInTheDocument();
  });

  it("CA3: administrador vê o conteúdo", async () => {
    setup({ account, links: [L("l1", "ADMINISTRATOR")], activeLinkId: "l1", twoFactor: off });
    expect(await screen.findByText("conteudo protegido")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: TITLE })).not.toBeInTheDocument();
  });

  it("CA4: sem vínculo ativo nega", async () => {
    setup({ account, links: [L("l1", "ADMINISTRATOR")], activeLinkId: null, twoFactor: off });
    expect(await screen.findByRole("heading", { name: TITLE })).toBeInTheDocument();
    expect(screen.queryByText("conteudo protegido")).not.toBeInTheDocument();
  });

  it("CA8: erro de sessão mostra ErrorState, não a tela", async () => {
    setup(new Response(null, { status: 500 }));
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: TITLE })).not.toBeInTheDocument();
  });
});
