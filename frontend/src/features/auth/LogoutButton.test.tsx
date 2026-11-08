import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { server } from "@/mocks/server";
import { LogoutButton } from "./LogoutButton";
import { SessionProvider, type SessionView } from "./SessionProvider";
import { RequireSession } from "./RequireSession";

const session: SessionView = {
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [],
  activeLinkId: null,
  twoFactor: { enabled: false, required: false },
};

function Where() {
  const l = useLocation();
  return <p data-testid="where">{l.pathname + l.search}</p>;
}

function open() {
  server.use(http.get("/api/v1/auth/session", () => HttpResponse.json(session)));
  return render(
    <MemoryRouter initialEntries={["/agenda"]}>
      <SessionProvider>
        <Routes>
          <Route path="/entrar" element={<p>login</p>} />
          <Route element={<RequireSession />}>
            <Route path="/agenda" element={<LogoutButton />} />
          </Route>
        </Routes>
        <Where />
      </SessionProvider>
    </MemoryRouter>,
  );
}

describe("LogoutButton", () => {
  it("CA1/CA5: chama POST /auth/logout e vai para /entrar sem next", async () => {
    const calls: string[] = [];
    server.use(
      http.post("/api/v1/auth/logout", () => {
        calls.push("logout");
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole("button", { name: "Sair da conta" }));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/entrar$/));
    expect(calls).toEqual(["logout"]);
  });

  it("CA4: com erro mantém a rota e o 'Tentar de novo' repete a chamada", async () => {
    let n = 0;
    server.use(
      http.post("/api/v1/auth/logout", () => {
        n += 1;
        return n === 1 ? new HttpResponse(null, { status: 500 }) : new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole("button", { name: "Sair da conta" }));
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent(/^\/entrar$/));
    expect(n).toBe(2);
  });

  it("CA4: com erro a URL não muda", async () => {
    server.use(http.post("/api/v1/auth/logout", () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    open();
    await user.click(await screen.findByRole("button", { name: "Sair da conta" }));
    await screen.findByRole("alert");
    expect(screen.getByTestId("where")).toHaveTextContent("/agenda");
  });
});
