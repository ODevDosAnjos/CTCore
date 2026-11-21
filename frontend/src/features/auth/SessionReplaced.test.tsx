import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { App } from "@/App";
import { api } from "@/lib/api";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { SessionProvider } from "./SessionProvider";

function Probe() {
  const l = useLocation();
  return (
    <>
      <p data-testid="where">{l.pathname + l.search}</p>
      <button onClick={() => void api("/probe").catch(() => undefined)}>probe</button>
    </>
  );
}

describe("RN-ACE-23: CA6 · próxima ação com a sessão encerrada por outro aparelho", () => {
  it("a resposta SESSION_REPLACED leva a /entrar sem next e mostra o aviso", async () => {
    const user = userEvent.setup();
    server.use(http.get("/api/v1/probe", () => HttpResponse.json({ code: "SESSION_REPLACED", message: "m", changed: false, fields: [], traceId: "t" }, { status: 401 })));
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/entrar"]}>
          <SessionProvider>
            <App />
            <Probe />
          </SessionProvider>
        </MemoryRouter>
      </ThemeProvider>,
    );
    await screen.findByLabelText("Senha");
    await user.click(screen.getByRole("button", { name: "probe" }));
    expect(await screen.findByText("Sua sessão foi encerrada porque esta conta entrou em outro aparelho.")).toBeInTheDocument();
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/entrar$/);
  });
});
