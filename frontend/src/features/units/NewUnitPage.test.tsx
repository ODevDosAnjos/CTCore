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
import type { NewUnit, UnitSummary } from "./useUnits";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const unit = (n: number): UnitSummary => ({
  id: `u${n}`,
  name: `Unidade ${n}`,
  shortName: `alfa-${n}`,
  shortNameAdjusted: false,
  city: null,
  activeStudents: 0,
  administrators: [],
  active: true,
  deactivatedAt: null,
});
const created = unit(99);
const catalog = [
  { id: "m1", name: "Jiu-Jitsu", active: true },
  { id: "m2", name: "Judô", active: true },
  { id: "m3", name: "Boxe", active: false },
];

let posts: NewUnit[];
let puts: string[];

function setup(role: string, path: string, opts: { list?: UnitSummary[]; post?: () => Response; put?: (modality: string) => Response } = {}) {
  posts = [];
  puts = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
    http.get("/api/v1/units", () => HttpResponse.json(opts.list ?? [unit(1)])),
    http.get("/api/v1/modalities", () => HttpResponse.json(catalog)),
    http.post("/api/v1/units", async ({ request }) => {
      posts.push((await request.json()) as NewUnit);
      return opts.post?.() ?? HttpResponse.json({ unit: created, invite: "SENT" }, { status: 201 });
    }),
    http.put("/api/v1/units/:unitId/modalities/:modalityId", ({ params }) => {
      puts.push(`${params.unitId}:${params.modalityId}`);
      return opts.put?.(String(params.modalityId)) ?? HttpResponse.json({ id: params.modalityId, offered: true });
    }),
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

const NEW = "/configuracoes/unidades/nova";
type User = ReturnType<typeof userEvent.setup>;
const next = (user: User) => user.click(screen.getByRole("button", { name: "Continuar" }));
const wizard = () => screen.findByRole("heading", { name: "Nova unidade", level: 1 });
/** Nome na etapa 1 e avança até a etapa do Administrador. */
async function toLast(user: User, name = "Nova") {
  await wizard();
  await user.type(screen.getByLabelText(/Nome da unidade/), name);
  await next(user);
  await next(user);
  await next(user);
}

describe("NewUnitPage", () => {
  it("CA4: quatro etapas em linha, Nome curto gerado, CEP e Endereço, mapa em breve; Continuar só com nome válido; Cancelar volta à lista", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW);
    await wizard();
    expect(screen.getByText('Assistente curto · o resto entra nos "Primeiros passos" da unidade')).toBeInTheDocument();
    const steps = screen.getByRole("list", { name: "Etapas" });
    expect(within(steps).getAllByRole("listitem").map((i) => i.textContent)).toEqual(["1Nome e endereço", "2Contato", "3Modalidades", "4Administrador"]);
    expect(within(steps).getByText("Nome e endereço").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await user.type(screen.getByLabelText(/Nome da unidade/), "Academia Leão — Tijuca");
    expect(screen.getByLabelText("Nome curto")).toHaveValue("academia-leao-tijuca");
    expect(screen.getByText("Gerado do nome; ajustável uma vez")).toBeInTheDocument();
    expect(screen.getByLabelText("CEP")).toBeInTheDocument();
    expect(screen.getByLabelText("Endereço")).toBeInTheDocument();
    expect(screen.getByText("Arraste o pino para ajustar · usado no diretório")).toBeInTheDocument();
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    await user.click(screen.getByRole("link", { name: "Cancelar" }));
    expect(await screen.findByRole("heading", { name: "Unidades", level: 1 })).toBeInTheDocument();
  });

  it("CA5 / CA6: modalidades ativas com interruptor, convite só com nome e e-mail; cria e liga as modalidades escolhidas; a lista confirma", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW);
    await wizard();
    await user.type(screen.getByLabelText(/Nome da unidade/), "Academia Tijuca");
    await next(user);
    await user.type(screen.getByLabelText("E-mail da unidade"), "tijuca@exemplo.com");
    await next(user);
    expect(await screen.findByRole("switch", { name: "Jiu-Jitsu" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Judô" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Boxe" })).toBeNull();
    await user.click(screen.getByRole("switch", { name: "Jiu-Jitsu" }));
    await user.click(screen.getByRole("switch", { name: "Judô" }));
    await next(user);
    await user.type(screen.getByLabelText("Nome do Administrador"), "Ana");
    expect(screen.getByRole("button", { name: "Criar unidade" })).toBeDisabled();
    expect(screen.getByText("Informe o nome e o e-mail juntos, ou deixe os dois vazios.")).toBeInTheDocument();
    await user.type(screen.getByLabelText("E-mail do Administrador"), "ana@exemplo.com");
    expect(screen.getByText(/Vamos enviar um convite de Administrador desta unidade para Ana \(ana@exemplo.com\)/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByRole("heading", { name: "Unidades", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Unidade Unidade 99 criada.")).toBeInTheDocument();
    expect(posts).toEqual([{ name: "Academia Tijuca", email: "tijuca@exemplo.com", administrator: { name: "Ana", email: "ana@exemplo.com" } }]);
    expect(puts.sort()).toEqual(["u99:m1", "u99:m2"]);
  });

  it("CA5: nenhuma modalidade marcada permite criar; sem convite o resumo diz que nenhum será enviado", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW);
    await toLast(user);
    expect(screen.getByText("Nenhum convite será enviado agora.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByRole("heading", { name: "Unidades", level: 1 })).toBeInTheDocument();
    expect(puts).toEqual([]);
  });

  it("voltar mantém o que foi preenchido e CEP ou coordenadas inválidos bloqueiam o avanço", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW);
    await wizard();
    await user.type(screen.getByLabelText(/Nome da unidade/), "Nova");
    await user.type(screen.getByLabelText("CEP"), "123");
    expect(screen.getByText("Confira o CEP: são 8 números.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await user.clear(screen.getByLabelText("CEP"));
    await user.type(screen.getByLabelText("Latitude"), "95");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await user.clear(screen.getByLabelText("Latitude"));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    await next(user);
    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(screen.getByLabelText(/Nome da unidade/)).toHaveValue("Nova");
  });

  it("CA6: 409 UNIT_LIMIT_REACHED mostra a mensagem do limite e permite tentar de novo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW, { post: () => HttpResponse.json({ code: "UNIT_LIMIT_REACHED", fields: [] }, { status: 409 }) });
    await toLast(user);
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("A organização já tem 10 unidades");
    expect(puts).toEqual([]);
    expect(screen.getByRole("button", { name: "Criar unidade" })).toBeEnabled();
  });

  it("CA6: 400 em um campo leva à etapa do campo e aponta o erro", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW, { post: () => HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "email", message: "inválido" }] }, { status: 400 }) });
    await toLast(user);
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent('Confira o campo "email" na etapa "Contato".');
    expect(screen.getByLabelText("E-mail da unidade")).toBeInTheDocument();
  });

  it("falha do servidor mostra o erro", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW, { post: () => HttpResponse.json({ code: "INTERNAL_ERROR", fields: [] }, { status: 500 }) });
    await toLast(user);
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível criar a unidade");
  });

  it("403 do servidor mostra o estado sem permissão", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW, { post: () => HttpResponse.json({ code: "FORBIDDEN", fields: [] }, { status: 403 }) });
    await toLast(user);
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("convite que falhou mantém a tela com a unidade criada e o aviso", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW, { post: () => HttpResponse.json({ unit: created, invite: "FAILED" }, { status: 201 }) });
    await toLast(user);
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByText("Unidade Unidade 99 criada.")).toBeInTheDocument();
    expect(screen.getByText(/o convite não foi enviado/)).toBeInTheDocument();
  });

  it("D6: modalidade que não liga avisa e leva à unidade criada", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", NEW, { put: () => HttpResponse.json({ code: "INTERNAL_ERROR", fields: [] }, { status: 500 }) });
    await wizard();
    await user.type(screen.getByLabelText(/Nome da unidade/), "Nova");
    await next(user);
    await next(user);
    await user.click(await screen.findByRole("switch", { name: "Judô" }));
    await next(user);
    await user.click(screen.getByRole("button", { name: "Criar unidade" }));
    expect(await screen.findByText(/não foi possível ligar todas as modalidades/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir a unidade" })).toHaveAttribute("href", "/configuracoes/unidade?unidade=u99");
  });

  it("com menos de 10 unidades o botão abre o assistente", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", "/configuracoes/unidades");
    await user.click(await screen.findByRole("link", { name: "Nova unidade" }));
    await wizard();
  });

  it("o Administrador não vê o assistente e a rota mostra que a área não está disponível", async () => {
    setup("ADMINISTRATOR", NEW);
    expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Nova unidade" })).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: a 360 px não tem violações no axe no tema %s, em cada etapa", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR", NEW);
    await wizard();
    expect(await axeViolations(container)).toEqual([]);
    await user.type(screen.getByLabelText(/Nome da unidade/), "Nova");
    for (let i = 0; i < 3; i++) {
      await next(user);
      if (i === 1) await screen.findByRole("switch", { name: "Jiu-Jitsu" });
      expect(await axeViolations(container)).toEqual([]);
    }
  });
});
