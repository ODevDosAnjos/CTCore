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

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const unit = (id: string, name: string) => ({ id, name, shortName: name.toLowerCase().replace(" ", "-") });
const KEY = "ctcore.unitScope.l1";

function setup(role: string, reachable: () => Response | Promise<Response>) {
  const session: SessionView = {
    account: { id: "a", email: "x@x.com", name: "X" },
    links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
    activeLinkId: "l1",
    twoFactor: { enabled: false, required: false },
  };
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session)),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", reachable),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
const two = (allUnits: boolean) => () => HttpResponse.json({ allUnits, units: [unit(A, "Unidade A"), unit(B, "Unidade B")] });
// A barra tem a versão do desktop e a do celular no DOM (o CSS esconde uma delas); a primeira é a do desktop.
const switcher = async () => (await screen.findAllByRole("button", { name: /^Unidade ativa/ }))[0];
const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await switcher());
  return screen.getByRole("list", { name: "Unidade ativa" });
};
const names = (list: HTMLElement) => within(list).getAllByRole("button").map((o) => o.textContent);

describe("seletor de unidade (RF-ORG-05)", () => {
  it("D6 / CA8: com uma unidade é só rótulo, sem botão nem lista; com duas há botão", async () => {
    const one = setup("ADMINISTRATOR", () => HttpResponse.json({ allUnits: false, units: [unit(A, "Unidade A")] }));
    expect(await screen.findByText("Unidade: Unidade A")).toBeInTheDocument();
    expect(screen.getAllByRole("group", { name: "Unidade ativa: Unidade A" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /^Unidade ativa/ })).not.toBeInTheDocument();
    one.unmount();
    setup("ADMINISTRATOR", two(false));
    expect(await switcher()).toBeInTheDocument();
  });

  it("RN-ORG-09 / CA8: Coordenador lista Todas as unidades (Só consulta) e as duas, começando em Todas; Administrador só as duas", async () => {
    const user = userEvent.setup();
    const coordinator = setup("COORDINATOR", two(true));
    const list = await open(user);
    expect(names(list)).toEqual(["Todas as unidadesSó consulta", "Unidade A", "Unidade B"]);
    expect(within(list).getAllByRole("button")[0]).toHaveAttribute("aria-current", "true");
    expect(screen.getByText(/todas as unidades, só para consulta/)).toBeInTheDocument();
    coordinator.unmount();
    setup("ADMINISTRATOR", two(false));
    const admin = await open(user);
    expect(names(admin)).toEqual(["Unidade A", "Unidade B"]);
    expect(within(admin).getAllByRole("button")[0]).toHaveAttribute("aria-current", "true");
  });

  it("CA8: a escolha válida é guardada e mantida; a que saiu do alcance volta ao padrão", async () => {
    const user = userEvent.setup();
    const selected = async () => {
      const list = await open(user);
      return within(list).getAllByRole("button").findIndex((o) => o.getAttribute("aria-current") === "true");
    };
    const first = setup("COORDINATOR", two(true));
    await user.click(within(await open(user)).getByRole("button", { name: "Unidade B" }));
    expect(localStorage.getItem(KEY)).toBe(B);
    first.unmount();
    const second = setup("COORDINATOR", two(true));
    expect(await selected()).toBe(2);
    second.unmount();
    localStorage.setItem(KEY, "00000000-0000-0000-0000-0000000000ff");
    const third = setup("COORDINATOR", two(true));
    expect(await selected()).toBe(0);
    third.unmount();
    // Administrador nunca herda "all" guardado
    localStorage.setItem(KEY, "all");
    setup("ADMINISTRATOR", two(false));
    expect(await selected()).toBe(0);
  });

  it("CA9: carregando e erro com Tentar de novo sem derrubar a página; 403 sem seletor", async () => {
    const user = userEvent.setup();
    const loading = setup("COORDINATOR", () => new Promise<Response>(() => {}));
    expect((await screen.findAllByText("Carregando unidades..."))[0]).toBeInTheDocument();
    loading.unmount();
    let fail = true;
    const failing = setup("COORDINATOR", () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : two(true)()));
    expect((await screen.findAllByText("Não foi possível carregar as unidades."))[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Início", hidden: true })[0]).toBeInTheDocument();
    fail = false;
    await user.click(screen.getAllByRole("button", { name: "Tentar de novo" })[0]);
    expect(await switcher()).toBeInTheDocument();
    failing.unmount();
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    await screen.findAllByRole("link", { name: "Início", hidden: true });
    expect(screen.queryByRole("button", { name: /^Unidade ativa/ })).not.toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA9: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR", two(true));
    await switcher();
    expect(await axeViolations(container)).toEqual([]);
  });
});
