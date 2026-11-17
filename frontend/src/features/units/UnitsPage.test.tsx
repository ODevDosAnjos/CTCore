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
import type { UnitSummary } from "./useUnits";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const unit = (over: Partial<UnitSummary> = {}): UnitSummary => ({
  id: "u1",
  name: "Tijuca",
  shortName: "academia-leao-tijuca",
  shortNameAdjusted: false,
  city: "Rio de Janeiro/RJ",
  activeStudents: 131,
  administrators: [{ name: "Carla Mendes" }],
  active: true,
  deactivatedAt: null,
  ...over,
});
const barra = unit({ id: "u2", name: "Barra", shortName: "academia-leao-barra", activeStudents: 83, administrators: [{ name: "Carla Mendes" }, { name: "Diego Alves" }] });
const meier = unit({ id: "u3", name: "Méier", shortName: "academia-leao-meier", activeStudents: 0, administrators: [], active: false, deactivatedAt: "2026-06-30T15:00:00Z" });
const three = [unit(), barra, meier];

function setup(role: string, read: () => Response | Promise<Response> = () => HttpResponse.json(three)) {
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
    http.get("/api/v1/units", read),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/configuracoes/unidades"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Unidades", level: 1 });

describe("UnitsPage", () => {
  it("CA1 / CA2 / CA3: subtítulo, tabela em cartão, selos, Abrir, Ver histórico em breve, nota e botões vermelhos", async () => {
    setup("COORDINATOR");
    await ready();
    expect(screen.getByText(/^2 ativas · até 10 unidades e 200 usuários por organização · unidades não mudam o preço$/)).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Unidades da organização" });
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Unidade", "Cidade", "Alunos ativos", "Administradores", "Situação", "Nome curto", "Ações"]);
    const rowOf = (name: string) => within(table).getAllByRole("row").find((r) => r.querySelector("td")?.textContent === name)!;
    const tijuca = rowOf("Tijuca");
    expect(within(tijuca).getByText("Rio de Janeiro/RJ")).toBeInTheDocument();
    expect(within(tijuca).getByText("Ativa")).toBeInTheDocument();
    expect(within(tijuca).getByRole("link", { name: /Abrir/ })).toHaveAttribute("href", "/configuracoes/unidade?unidade=u1");
    expect(within(rowOf("Barra")).getByText("Carla Mendes, Diego Alves")).toBeInTheDocument();
    const meierRow = rowOf("Méier");
    expect(within(meierRow).getByText("Desativada em 30/06/2026")).toBeInTheDocument();
    expect(within(meierRow).getByText("Nenhum Administrador")).toBeInTheDocument();
    expect(within(meierRow).getByRole("button", { name: "Ver histórico" })).toHaveAttribute("aria-disabled", "true");
    expect(within(meierRow).getByText("Em breve")).toBeInTheDocument();
    expect(within(table).queryByRole("button", { name: /Configurar|Desativar a|Ajustar nome curto/ })).toBeNull();
    expect(screen.getByText("O nome curto aparece nos links públicos (ctcore.com.br/aula/academia-leao-tijuca). É único na plataforma e pode ser ajustado uma vez; o antigo redireciona.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativar a Tijuca…" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativar a Barra…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar a Méier…" })).toBeNull();
    expect(screen.getByRole("link", { name: "Nova unidade" })).toHaveAttribute("href", "/configuracoes/unidades/nova");
  });

  it("CA1: com uma só unidade ativa o subtítulo é \"1 unidade ativa\" e o botão abre a janela informativa", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () => HttpResponse.json([unit()]));
    await ready();
    expect(screen.getByText("1 unidade ativa")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Desativar a Tijuca…" }));
    const dialog = await screen.findByRole("dialog", { name: "A única unidade ativa não pode ser desativada" });
    expect(within(dialog).getByText(/cancele a assinatura em Configurações › Assinatura/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Ir para a assinatura" })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).queryByRole("textbox")).toBeNull();
    await user.click(within(dialog).getAllByRole("button", { name: "Fechar" })[1]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA13: mostra carregando, depois erro com nova tentativa que recarrega, e vazio", async () => {
    const user = userEvent.setup();
    let calls = 0;
    setup("COORDINATOR", () => (++calls === 1 ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json([])));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: "Nenhuma unidade" })).toBeInTheDocument();
  });

  it("CA13: o 403 do servidor mostra o estado sem permissão", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA14: o Administrador não vê Unidades no menu e a rota mostra que a área não está disponível", async () => {
    setup("ADMINISTRATOR");
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Unidades", level: 1 })).toBeNull();
  });

  it("com 10 unidades o botão Nova unidade fica desabilitado com o motivo", async () => {
    setup("COORDINATOR", () => HttpResponse.json(Array.from({ length: 10 }, (_, i) => unit({ id: `u${i}`, name: `Unidade ${i}` }))));
    await ready();
    const button = screen.getByRole("button", { name: "Nova unidade" });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(/10 unidades/);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: a 360 px não tem violações no axe no tema %s, com a lista e com a janela aberta", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR");
    await ready();
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Desativar a Barra…" }));
    await screen.findByRole("dialog");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
