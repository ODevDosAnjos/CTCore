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
  activeStudents: 0,
  administrators: [],
  active: true,
  deactivatedAt: null,
  ...over,
});

type Check = { activeStudents: number; activeClasses: number; pendingProofs: number; lastActiveUnit: boolean; canDeactivate: boolean };
const free: Check = { activeStudents: 0, activeClasses: 0, pendingProofs: 0, lastActiveUnit: false, canDeactivate: true };
let units: UnitSummary[];
let calls: { token: string | null; body: unknown }[];

function setup(opts: { role?: string; check?: () => Response | Promise<Response>; deactivate?: () => Response | Promise<Response> } = {}) {
  const role = opts.role ?? "COORDINATOR";
  units = [unit(), unit({ id: "u2", name: "Barra", shortName: "academia-leao-barra" })];
  calls = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
    http.get("/api/v1/units", () => HttpResponse.json(units)),
    http.get("/api/v1/units/:id/deactivation-check", () => (opts.check ? opts.check() : HttpResponse.json(free))),
    http.post("/api/v1/auth/reauth", () => HttpResponse.json({ reauthToken: "tok", expiresAt: "2030-01-01T00:00:00Z" })),
    http.post("/api/v1/units/:id/deactivation", async ({ request, params }) => {
      calls.push({ token: request.headers.get("X-Reauth-Token"), body: await request.json() });
      if (opts.deactivate) return opts.deactivate();
      units = units.map((u) => (u.id === params.id ? { ...u, active: false, deactivatedAt: "2026-11-17T15:00:00Z" } : u));
      return new HttpResponse(null, { status: 204 });
    }),
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

type User = ReturnType<typeof userEvent.setup>;
const open = async (user: User) => {
  await user.click(await screen.findByRole("button", { name: "Desativar a Barra…" }));
  return screen.findByRole("dialog", { name: "Desativar a Barra" });
};
const WORD = "Digite DESATIVAR para confirmar";
const reauth = async (user: User) => {
  await user.click(screen.getByRole("button", { name: "Desativar unidade" }));
  await user.type(await screen.findByLabelText("Senha"), "segredo123");
  await user.click(screen.getByRole("button", { name: "Confirmar" }));
};

describe("DeactivateUnitDialog (RF-ORG-07)", () => {
  it("CA7: com alunos e turmas ativos mostra o texto, o checklist com os links, a orientação e não deixa continuar", async () => {
    const user = userEvent.setup();
    setup({ check: () => HttpResponse.json({ ...free, activeStudents: 83, activeClasses: 5, canDeactivate: false }) });
    const dialog = await open(user);
    expect(await within(dialog).findByText("Desativar exige que não haja alunos com modalidade ativa nem turmas ativas. O histórico fica para consulta.")).toBeInTheDocument();
    expect(within(dialog).getByText("O que impede agora")).toBeInTheDocument();
    expect(dialog).toHaveTextContent("83 alunos com modalidade ativa");
    expect(dialog).toHaveTextContent("5 turmas ativas");
    expect(dialog).toHaveTextContent("Nenhuma cobrança em conferência");
    expect(within(dialog).getByRole("link", { name: "Ver alunos" })).toHaveAttribute("href", "/alunos?unitId=u2&status=ACTIVE");
    expect(within(dialog).getByRole("link", { name: "Ver turmas" })).toHaveAttribute("href", "/turmas?unitId=u2&status=ACTIVE");
    expect(within(dialog).getByText("Transfira ou encerre as modalidades antes. Depois volte aqui para confirmar digitando DESATIVAR e sua senha.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Desativar unidade" })).toBeDisabled();
    expect(within(dialog).queryByLabelText(WORD)).toBeNull();
  });

  it("CA10: cobrança em conferência impede e mostra a contagem", async () => {
    const user = userEvent.setup();
    setup({ check: () => HttpResponse.json({ ...free, pendingProofs: 1, canDeactivate: false }) });
    const dialog = await open(user);
    expect(await within(dialog).findByText("1 cobrança em conferência")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Desativar unidade" })).toBeDisabled();
  });

  it("CA8: sem impedimento habilita ao digitar DESATIVAR (qualquer caixa, com espaços), pede a senha, só então chama a rota; a lista mostra a data e o aviso", async () => {
    const user = userEvent.setup();
    setup();
    await open(user);
    const next = screen.getByRole("button", { name: "Desativar unidade" });
    expect(next).toBeDisabled();
    await user.type(screen.getByLabelText(WORD), "Barra");
    expect(next).toBeDisabled();
    await user.clear(screen.getByLabelText(WORD));
    await user.type(screen.getByLabelText(WORD), " desativar ");
    expect(next).toBeEnabled();
    await user.click(next);
    await screen.findByRole("dialog", { name: "Confirme que é você" });
    expect(calls).toEqual([]);
    await user.type(screen.getByLabelText("Senha"), "segredo123");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText(/Unidade desativada\./)).toBeInTheDocument();
    expect(calls).toEqual([{ token: "tok", body: { confirmation: "desativar" } }]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Desativada em 17/11/2026")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desativar a Barra…" })).not.toBeInTheDocument();
  });

  it("CA8: 400 mostra a mensagem no campo; 409 volta a consultar e mostra o que impede", async () => {
    const user = userEvent.setup();
    let blocked = false;
    setup({
      check: () => HttpResponse.json(blocked ? { ...free, activeStudents: 3, canDeactivate: false } : free),
      deactivate: () => {
        if (blocked) return HttpResponse.json({ code: "UNIT_HAS_BLOCKERS", fields: [] }, { status: 409 });
        return HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "confirmation", message: "x" }] }, { status: 400 });
      },
    });
    await open(user);
    await user.type(screen.getByLabelText(WORD), "DESATIVAR");
    await reauth(user);
    expect(await screen.findByText("Digite a palavra DESATIVAR para confirmar.")).toBeInTheDocument();
    expect(screen.getByLabelText(WORD)).toHaveAttribute("aria-invalid", "true");

    blocked = true;
    await user.click(screen.getByRole("button", { name: "Desativar unidade" }));
    await user.type(await screen.findByLabelText("Senha"), "segredo123");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText(/3 alunos com modalidade ativa/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativar unidade" })).toBeDisabled();
  });

  it("CA13: erro da consulta e do envio mostram o erro com nova tentativa; 403 mostra o estado sem permissão", async () => {
    const user = userEvent.setup();
    let checks = 0;
    let status = 500;
    setup({
      check: () => (++checks === 1 ? HttpResponse.json({ code: "X" }, { status: 500 }) : HttpResponse.json(free)),
      deactivate: () => HttpResponse.json({ code: "X" }, { status }),
    });
    await open(user);
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    await user.type(await screen.findByLabelText(WORD), "DESATIVAR");
    await reauth(user);
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    status = 403;
    await user.type(await screen.findByLabelText("Senha"), "segredo123");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA13: 403 na consulta mostra o estado sem permissão", async () => {
    const user = userEvent.setup();
    setup({ check: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    await open(user);
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA14: o Administrador não vê o botão", async () => {
    setup({ role: "ADMINISTRATOR" });
    expect(await screen.findAllByRole("link", { name: /^Abrir/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Desativar/ })).not.toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: a 360 px, sem violações no axe no tema %s, na janela com impedimento e na com a confirmação", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    let blocked = true;
    setup({ check: () => HttpResponse.json(blocked ? { ...free, activeStudents: 2, canDeactivate: false } : free) });
    const dialog = await open(user);
    await within(dialog).findByText("2 alunos com modalidade ativa");
    expect(await axeViolations(dialog)).toEqual([]);
    blocked = false;
    await user.click(within(dialog).getAllByRole("button", { name: "Fechar" })[1]);
    const again = await open(user);
    await within(again).findByLabelText(WORD);
    expect(await axeViolations(again)).toEqual([]);
  });
});
