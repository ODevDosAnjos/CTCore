import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { portalShellOk } from "@/test/portalShell";
import { ThemeProvider } from "@/theme/ThemeProvider";

type TwoFactor = { enabled: boolean; required: boolean; enabledAt?: string | null };
const session = (role: string, twoFactor: TwoFactor = { enabled: false, required: false }, passwordChangedAt: string | null = "2026-08-12T15:00:00Z"): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X", passwordChangedAt },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [], unitNames: ["Centro"] }],
  activeLinkId: "l1",
  twoFactor,
});

// A sessão do mock fica ativa para as rotas que exigem login; o GET /auth/session é trocado por `current`.
type Handler = Parameters<typeof server.use>[number];
async function setup(role = "COORDINATOR", twoFactor: TwoFactor = { enabled: false, required: false }, path = SEGURANCA, extra: Handler[] = [], passwordChangedAt: string | null = "2026-08-12T15:00:00Z") {
  await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@b.c", password: "x" }) });
  let current = session(role, twoFactor, passwordChangedAt);
  server.use(
    ...extra,
    portalShellOk,
    http.get("/api/v1/auth/email-preferences", () => HttpResponse.json({ announcements: true })),
    http.get("/api/v1/auth/session", () => HttpResponse.json(current)),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
  );
  const view = render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <App />
          <Where />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
  return { ...view, setSession: (s: SessionView) => (current = s) };
}

function Where() {
  const l = useLocation();
  return <output data-testid="where">{l.pathname + l.search}</output>;
}

const ready = () => screen.findByRole("heading", { name: "Minha conta", level: 1 });
const strong = "NovaSenha123";
const SEGURANCA = "/conta?aba=seguranca";

const NAMES = ["Perfil", "Segurança", "Notificações", "Privacidade"];
const IDS = ["perfil", "seguranca", "notificacoes", "privacidade"];
const OFF: TwoFactor = { enabled: false, required: false };
// Um título que só existe dentro de cada aba, por área.
const CONTENT = {
  ADMINISTRATOR: ["Meus vínculos", "Sessões ativas", "Sino da gestão", "Baixar meus dados"],
  STUDENT: ["Meus vínculos", "Sessões ativas", "Preferências de e-mail", "Excluir minha conta"],
};

describe("AccountPage: abas (#762 CA1, CA2)", () => {
  it.each((["ADMINISTRATOR", "STUDENT"] as const).flatMap((role) => IDS.map((id, i) => [role, id, i] as const)))("%s abre ?aba=%s com as quatro abas em ordem e a pedida ativa", async (role, id, i) => {
    await setup(role, OFF, `/conta?aba=${id}`);
    await ready();
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(NAMES);
    expect(screen.getByRole("tab", { name: NAMES[i], selected: true })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: CONTENT[role][i] })).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(screen.getByRole("tabpanel"));
  });

  it("clicar muda a aba e a URL; as setas, Home e End movem o foco", async () => {
    const user = userEvent.setup();
    await setup("ADMINISTRATOR", OFF, "/conta");
    await ready();
    expect(screen.queryByText("X · Administrador da Centro")).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Notificações" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/conta?aba=notificacoes");
    expect(await screen.findByText("Sino da gestão")).toBeInTheDocument();
    screen.getByRole("tab", { name: "Notificações" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Privacidade" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Perfil" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Privacidade" })).toHaveFocus();
  });

  it.each(["ADMINISTRATOR", "STUDENT"].flatMap((role) => ["", "?aba=xyz", "?aba=acesso", "?aba=duas-etapas", "?aba=sessoes"].map((q) => [role, q] as const)))("%s com '%s' abre o Perfil", async (role, query) => {
    await setup(role, OFF, `/conta${query}`);
    await ready();
    expect(screen.getByRole("tab", { name: "Perfil", selected: true })).toBeInTheDocument();
  });

  it("no portal há o Voltar e o rótulo; o Perfil mostra só Meus vínculos", async () => {
    await setup("STUDENT", OFF, "/conta");
    await ready();
    expect(screen.getByText("Minhas informações", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minhas informações", current: "page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/portal/minhas-informacoes");
    expect(within(screen.getByRole("tabpanel")).getAllByRole("heading").map((h) => h.textContent)).toEqual(["Meus vínculos"]);
  });
});

describe("AccountPage: Segurança (#762 CA6, CA7)", () => {
  it("junta Acesso, duas etapas e sessões; no portal, sem coluna de local", async () => {
    await setup("STUDENT");
    await ready();
    for (const name of ["Acesso", "Verificação em duas etapas", "Sessões ativas"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    expect(screen.getByText("Opcional para alunos")).toBeInTheDocument();
    expect(await screen.findByText("Este aparelho")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Local" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });

  it.each([
    ["COORDINATOR", true, false],
    ["ADMINISTRATOR", true, false],
    ["ADMINISTRATOR", false, true],
    ["TEACHER", false, true],
    ["STUDENT", false, true],
    ["GUARDIAN", false, true],
  ])("%s (obrigado: %s) vê Desligar: %s", async (role, required, visible) => {
    await setup(role, { enabled: true, required, enabledAt: "2026-08-12T15:00:00Z" });
    await ready();
    await screen.findByRole("button", { name: "Ver códigos de reserva novos" });
    expect(!!screen.queryByRole("button", { name: "Desligar" })).toBe(visible);
  });
});

describe("AccountPage: cartão Acesso (CA3)", () => {
  it("mostra o e-mail e a data da senha, ou 'nunca alterada'", async () => {
    const first = await setup();
    await ready();
    expect(screen.getByText("x@x.com")).toBeInTheDocument();
    expect(screen.getByText("alterada em 12/08/2026")).toBeInTheDocument();
    expect(screen.queryByText(/O novo e-mail só vale depois de confirmado pelo link \(24 horas\)/)).not.toBeInTheDocument();
    first.unmount();
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA, [], null);
    await ready();
    expect(await screen.findByText("nunca alterada")).toBeInTheDocument();
  });
});

describe("AccountPage: senha (CA3)", () => {
  it("abre a janela; mostra o erro no campo com a senha atual errada e, com a certa, confirma e deixa só a sessão atual", async () => {
    const user = userEvent.setup();
    await setup();
    await ready();
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Trocar senha" }));
    const dialog = await screen.findByRole("dialog");
    const submit = within(dialog).getByRole("button", { name: "Trocar senha" });
    expect(submit).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Senha atual"), "errada");
    await user.type(within(dialog).getByLabelText("Senha", { selector: "#acc-senha" }), strong);
    await user.type(within(dialog).getByLabelText("Confirmar senha"), strong);
    await user.click(submit);
    expect(await within(dialog).findByText("A senha atual está incorreta.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("Senha atual"));
    await user.type(within(dialog).getByLabelText("Senha atual"), "Atual12345");
    await user.click(within(dialog).getByRole("button", { name: "Trocar senha" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("senha conhecida vira erro no campo da senha nova; 429 vira aviso do formulário", async () => {
    const user = userEvent.setup();
    await setup();
    await ready();
    await user.click(screen.getByRole("button", { name: "Trocar senha" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Senha atual"), "Atual12345");
    await user.type(within(dialog).getByLabelText("Senha", { selector: "#acc-senha" }), "Password1");
    await user.type(within(dialog).getByLabelText("Confirmar senha"), "Password1");
    await user.click(within(dialog).getByRole("button", { name: "Trocar senha" }));
    expect(await within(dialog).findByText("Essa senha é muito conhecida. Escolha outra.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText("Senha atual"));
    await user.type(within(dialog).getByLabelText("Senha atual"), "limite");
    await user.click(within(dialog).getByRole("button", { name: "Trocar senha" }));
    expect(await within(dialog).findByText("Muitas tentativas. Espere alguns minutos e tente de novo.")).toBeInTheDocument();
  });

  it("repetição diferente não deixa enviar", async () => {
    const user = userEvent.setup();
    await setup();
    await ready();
    await user.click(screen.getByRole("button", { name: "Trocar senha" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Senha atual"), "Atual12345");
    await user.type(within(dialog).getByLabelText("Senha", { selector: "#acc-senha" }), strong);
    await user.type(within(dialog).getByLabelText("Confirmar senha"), "Outra12345");
    expect(within(dialog).getByText("As senhas não são iguais.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Trocar senha" })).toBeDisabled();
  });

  it("o Aluno troca a senha pela janela da própria página, e as outras sessões saem da lista", async () => {
    const user = userEvent.setup();
    await setup("STUDENT");
    await ready();
    expect(await screen.findByText("Safari em iOS")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Trocar senha" }));
    const dialog = await screen.findByRole("dialog", { name: "Trocar senha" });
    await user.type(within(dialog).getByLabelText("Senha atual"), "Atual12345");
    await user.type(within(dialog).getByLabelText("Senha", { selector: "#acc-senha" }), strong);
    await user.type(within(dialog).getByLabelText("Confirmar senha"), strong);
    await user.click(within(dialog).getByRole("button", { name: "Trocar senha" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(screen.queryByText("Safari em iOS")).not.toBeInTheDocument());
    expect(await screen.findByText("Chrome em Windows")).toBeInTheDocument();
  });
});

describe("AccountPage: e-mail (CA3)", () => {
  it("abre a janela, pede o link e avisa; erros por campo", async () => {
    const user = userEvent.setup();
    await setup();
    await ready();
    await user.click(screen.getByRole("button", { name: "Trocar e-mail" }));
    const dialog = await screen.findByRole("dialog");
    const send = within(dialog).getByRole("button", { name: "Enviar link de confirmação" });
    await user.click(send);
    expect(await within(dialog).findByText("Preencha todos os campos.")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/^Novo e-mail/), "ana@exemplo.com");
    await user.type(within(dialog).getByLabelText(/^Senha atual/), "Atual12345");
    await user.click(send);
    expect(await within(dialog).findByText("Informe outro e-mail válido.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText(/^Novo e-mail/));
    await user.type(within(dialog).getByLabelText(/^Novo e-mail/), "novo@x.com");
    await user.clear(within(dialog).getByLabelText(/^Senha atual/));
    await user.type(within(dialog).getByLabelText(/^Senha atual/), "errada");
    await user.click(send);
    expect(await within(dialog).findByText("Senha incorreta.")).toBeInTheDocument();

    await user.clear(within(dialog).getByLabelText(/^Senha atual/));
    await user.type(within(dialog).getByLabelText(/^Senha atual/), "Atual12345");
    await user.click(send);
    expect(await within(dialog).findByText(/novo@x\.com puder ser usado/)).toBeInTheDocument();
    expect(within(dialog).getByText("Senha errada conta para a trava de 5 tentativas.")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText(/^Código do app autenticador/)).not.toBeInTheDocument();
    expect(within(dialog).getByText("Resumo")).toBeInTheDocument();
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(4);
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("com as duas etapas pede o código", async () => {
    const user = userEvent.setup();
    await setup("ADMINISTRATOR", { enabled: true, required: false }, SEGURANCA, [
      http.post("/api/v1/auth/email-change", async ({ request }) => {
        const { code } = (await request.json()) as { code?: string };
        return code === "123456" ? new HttpResponse(null, { status: 202 }) : HttpResponse.json({ code: "INVALID_TWO_FACTOR_CODE" }, { status: 401 });
      }),
    ]);
    await ready();
    await user.click(screen.getByRole("button", { name: "Trocar e-mail" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText(/^Novo e-mail/), "novo@x.com");
    await user.type(within(dialog).getByLabelText(/^Senha atual/), "Atual12345");
    await user.click(within(dialog).getByRole("button", { name: "Enviar link de confirmação" }));
    expect(await within(dialog).findByText("Preencha todos os campos.")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Código do app autenticador/), "000000");
    await user.click(within(dialog).getByRole("button", { name: "Enviar link de confirmação" }));
    expect(await within(dialog).findByText("Código incorreto.")).toBeInTheDocument();
    await user.clear(within(dialog).getByLabelText(/^Código do app autenticador/));
    await user.type(within(dialog).getByLabelText(/^Código do app autenticador/), "123456");
    await user.click(within(dialog).getByRole("button", { name: "Enviar link de confirmação" }));
    expect(await within(dialog).findByText(/novo@x\.com puder ser usado/)).toBeInTheDocument();
  });
});

describe("ConfirmEmailPage (CA7, CA8)", () => {
  it("confirma com o link válido e mostra o e-mail novo", async () => {
    const user = userEvent.setup();
    await setup("COORDINATOR", { enabled: false, required: false }, "/confirmar-email/valido");
    await screen.findByRole("heading", { name: "Confirmar novo e-mail" });
    await user.click(screen.getByRole("button", { name: "Confirmar troca" }));
    expect(await screen.findByText("E-mail alterado. Use o endereço novo para entrar.")).toBeInTheDocument();
  });

  it("link vencido, usado ou de outra conta mostra o aviso", async () => {
    const user = userEvent.setup();
    await setup("STUDENT", { enabled: false, required: false }, "/confirmar-email/vencido");
    await user.click(await screen.findByRole("button", { name: "Confirmar troca" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Este link venceu");
  });

  it("sem sessão leva ao login e guarda o link para voltar", async () => {
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={["/confirmar-email/valido"]}>
          <SessionProvider>
            <App />
          </SessionProvider>
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});

describe("AccountPage: duas etapas (CA5, CA9)", () => {
  it("Coordenador obrigado vê Ativa, a data e os códigos novos, sem Desligar; os códigos abrem direto", async () => {
    const user = userEvent.setup();
    await setup("COORDINATOR", { enabled: true, required: true, enabledAt: "2026-08-12T15:00:00Z" }, SEGURANCA);
    await ready();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText("app autenticador · ativada em 12/08/2026")).toBeInTheDocument();
    expect(screen.queryByText("Opcional para Administradores. Obrigatória para o Coordenador.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desligar" })).not.toBeInTheDocument();
    server.use(http.post("/api/v1/auth/two-factor/backup-codes", () => HttpResponse.json({ backupCodes: Array.from({ length: 10 }, (_, i) => `ABCDE0000${i}`) })));
    await user.click(screen.getByRole("button", { name: "Ver códigos de reserva novos" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findAllByRole("listitem")).toHaveLength(10);
    expect(within(dialog).getByText("ABCDE-00000")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("sem as duas etapas: Desligada e o botão Ativar; liga com QR, código e códigos, e Agora não fecha sem ativar", async () => {
    const user = userEvent.setup();
    const { setSession } = await setup("ADMINISTRATOR", { enabled: false, required: false }, SEGURANCA);
    await ready();
    expect(screen.getByText("Desligada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ativar duas etapas" }));
    await user.click(await screen.findByRole("button", { name: "Agora não" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ativar duas etapas" }));
    await user.type(await screen.findByLabelText("Digite o código de 6 números que aparece no app"), "123456");
    expect(screen.queryByText("Obrigatória para o Coordenador · configurada no primeiro acesso")).not.toBeInTheDocument();
    setSession(session("ADMINISTRATOR", { enabled: true, required: false, enabledAt: "2026-11-18T15:00:00Z" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(within(await screen.findByRole("list", { name: "Seus códigos de reserva" })).getAllByRole("listitem")).toHaveLength(10);
    await user.click(screen.getByLabelText("Guardei os códigos em lugar seguro"));
    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(await screen.findByText("Ativa")).toBeInTheDocument();
  });

  it("desliga com senha e código; erros aparecem nos campos", async () => {
    const user = userEvent.setup();
    const { setSession } = await setup("ADMINISTRATOR", { enabled: true, required: false, enabledAt: "2026-08-12T15:00:00Z" }, SEGURANCA);
    await ready();
    await user.click(screen.getByRole("button", { name: "Desligar" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Desligar" }));
    expect(await within(dialog).findByText("Preencha a senha e o código.")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Senha"), "errada");
    await user.type(within(dialog).getByLabelText("Código do app ou de reserva"), "123456");
    await user.click(within(dialog).getByRole("button", { name: "Desligar" }));
    expect(await within(dialog).findByText("Senha incorreta.")).toBeInTheDocument();

    setSession(session("ADMINISTRATOR"));
    await user.clear(within(dialog).getByLabelText("Senha"));
    await user.type(within(dialog).getByLabelText("Senha"), "Atual12345");
    await user.click(within(dialog).getByRole("button", { name: "Desligar" }));
    expect(await screen.findByText("Desligada")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("desligar: 429, 403 e falha do servidor têm estados próprios", async () => {
    const user = userEvent.setup();
    await setup("ADMINISTRATOR", { enabled: true, required: false, enabledAt: "2026-08-12T15:00:00Z" }, SEGURANCA);
    await ready();
    await user.click(screen.getByRole("button", { name: "Desligar" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Senha"), "limite");
    await user.type(within(dialog).getByLabelText("Código do app ou de reserva"), "123456");
    await user.click(within(dialog).getByRole("button", { name: "Desligar" }));
    expect(await within(dialog).findByText("Muitas tentativas. Espere alguns minutos e tente de novo.")).toBeInTheDocument();
    server.use(http.delete("/api/v1/auth/two-factor", () => new HttpResponse(null, { status: 403 })));
    await user.click(within(dialog).getByRole("button", { name: "Desligar" }));
    expect(await within(dialog).findByText("Você não tem acesso")).toBeInTheDocument();
  });
});

describe("AccountPage: sessões (CA6, CA13)", () => {
  it("tabela com Aparelho, Local e Último uso; selo só na atual; encerra uma sessão", async () => {
    const user = userEvent.setup();
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA);
    await ready();
    expect(await screen.findByText("Este aparelho")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Aparelho", "Local", "Último uso", "Ações"]);
    expect(screen.getAllByText("Este aparelho")).toHaveLength(1);
    expect(screen.queryByText("Sessões da gestão duram 12 horas; do portal, 30 dias.")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Encerrar a sessão em/ })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Encerrar a sessão em Safari em iOS" }));
    await waitFor(() => expect(screen.queryByText("Safari em iOS")).not.toBeInTheDocument());
    expect(screen.getByText("Não há outras sessões ativas.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Encerrar todas as outras" })).not.toBeInTheDocument();
  });

  it("encerra todas as outras só depois da confirmação", async () => {
    const user = userEvent.setup();
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA);
    await ready();
    await user.click(await screen.findByRole("button", { name: "Encerrar todas as outras" }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.getByText("Safari em iOS")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Encerrar todas as outras" }));
    await waitFor(() => expect(screen.queryByText("Safari em iOS")).not.toBeInTheDocument());
    expect(screen.getByText("Chrome em Windows")).toBeInTheDocument();
  });

  it("falha ao encerrar mostra o aviso", async () => {
    const user = userEvent.setup();
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA, [http.delete("/api/v1/auth/sessions/:id", () => new HttpResponse(null, { status: 500 }))]);
    await ready();
    await user.click(await screen.findByRole("button", { name: "Encerrar a sessão em Safari em iOS" }));
    expect(await screen.findByText("Não conseguimos encerrar a sessão. Tente de novo.")).toBeInTheDocument();
  });

  it("abaixo de 640 px a lista vira cartões, sem tabela", async () => {
    setDeviceNarrow(true);
    window.innerWidth = 360;
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA);
    await ready();
    expect(await screen.findByRole("list", { name: "Sessões ativas" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Encerrar a sessão em Safari em iOS" })).toBeInTheDocument();
  });

  it("carregando, erro com Tentar de novo e sessão expirada", async () => {
    const user = userEvent.setup();
    let fail = true;
    let release = () => {};
    const gate = new Promise<void>((r) => (release = r));
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA, [
      http.get("/api/v1/auth/sessions", async () => {
        await gate;
        return fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([]);
      }),
    ]);
    await ready();
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    release();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument());
  });

  it("401 na lista volta ao login", async () => {
    let calls = 0;
    await setup("COORDINATOR", { enabled: false, required: false }, SEGURANCA, [
      http.get("/api/v1/auth/sessions", () => HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 })),
      http.get("/api/v1/auth/session", () => (calls++ === 0 ? HttpResponse.json(session("COORDINATOR")) : HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 }))),
    ]);
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});

describe("AccountPage: lista do celular (CA12, #762 CA2)", () => {
  it("a 390 px sem ?aba= válida mostra a lista de atalhos com Sair e sem abas; tocar abre a aba com seta de voltar", async () => {
    const user = userEvent.setup();
    setDeviceNarrow(true);
    window.innerWidth = 390;
    await setup("COORDINATOR", { enabled: true, required: true, enabledAt: "2026-08-12T15:00:00Z" }, "/conta?aba=sessoes");
    await ready();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByText("Coordenador · Centro")).toBeInTheDocument();
    expect(screen.getByText("Ligada")).toBeInTheDocument();
    expect(screen.getByText(/alterada há \d+ meses?/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Sair/ }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("link", { name: /Sessões ativas/ }));
    expect(screen.getByTestId("where")).toHaveTextContent("/conta?aba=seguranca");
    expect(await screen.findByText("Este aparelho")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Voltar para Minha conta" }));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/conta$/);
    expect(await screen.findByText("Duas etapas")).toBeInTheDocument();
  });

  it("as linhas abrem a aba correspondente", async () => {
    setDeviceNarrow(true);
    window.innerWidth = 390;
    await setup("COORDINATOR", OFF, "/conta");
    await ready();
    // só a lista de atalhos: a moldura também tem links
    const list = screen.getAllByRole("list").find((l) => within(l).queryByRole("link", { name: /^Privacidade/ }))!;
    const rows = within(list).getAllByRole("link");
    expect(rows.map((a) => a.getAttribute("href"))).toEqual(["perfil", "seguranca", "seguranca", "seguranca", "seguranca", "notificacoes", "privacidade"].map((id) => `/conta?aba=${id}`));
    ["Perfil", "Senha", "E-mail", "Duas etapas", "Sessões ativas", "Notificações", "Privacidade"].forEach((label, i) => expect(rows[i]).toHaveTextContent(label));
  });

  it("Sair encerra a sessão e volta ao login", async () => {
    const user = userEvent.setup();
    setDeviceNarrow(true);
    window.innerWidth = 390;
    await setup("COORDINATOR", OFF, "/conta");
    await ready();
    server.use(http.get("/api/v1/auth/session", () => HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 })));
    await user.click(screen.getByRole("button", { name: "Sair" }));
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });

  it("a partir de 768 px não existe a lista", async () => {
    setDeviceNarrow(false);
    await setup("COORDINATOR");
    await ready();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.queryByRole("link", { name: /Sessões ativas/ })).not.toBeInTheDocument();
  });
});

describe("foto da conta no avatar (#763 CA6)", () => {
  const withPhoto = (role: string, url: string) => ({ ...session(role), account: { ...session(role).account, photoUrl: url } });
  const srcs = (root: ParentNode) => Array.from(root.querySelectorAll("img[src^='https://arquivos.test']"), (i) => i.getAttribute("src"));

  it.each(["COORDINATOR", "STUDENT"])("%s: o topo mostra a foto", async (role) => {
    await setup(role, OFF, "/conta", [http.get("/api/v1/auth/session", () => HttpResponse.json(withPhoto(role, "https://arquivos.test/a.png")))]);
    await ready();
    await waitFor(() => expect(srcs(screen.getAllByRole("banner")[0])).toEqual(["https://arquivos.test/a.png"]));
  });

  it("a imagem que falha vira iniciais e a sessão é relida uma só vez, também na lista do celular", async () => {
    setDeviceNarrow(true);
    window.innerWidth = 390;
    let reads = 0;
    await setup("COORDINATOR", OFF, "/conta", [http.get("/api/v1/auth/session", () => HttpResponse.json(withPhoto("COORDINATOR", `https://arquivos.test/${++reads}.png`)))]);
    await ready();
    const main = screen.getByRole("main");
    expect(srcs(main)).toEqual(["https://arquivos.test/1.png"]);
    const fail = () => document.querySelectorAll("img[src^='https://arquivos.test']").forEach((i) => fireEvent.error(i));
    fail();
    await waitFor(() => expect(srcs(main)).toEqual(["https://arquivos.test/2.png"]));
    fail();
    await new Promise((r) => setTimeout(r, 100));
    expect(reads).toBe(2);
    expect(srcs(document)).toEqual([]);
    expect(within(main).getByText("X", { selector: "span" })).toBeInTheDocument();
  });
});

describe("AccountPage: acessibilidade em 360 px (CA13, #762 CA10)", () => {
  it.each((["ADMINISTRATOR", "STUDENT"] as const).flatMap((role) => IDS.flatMap((id, i) => [false, true].map((dark) => [role, id, dark, i] as const))))(
    "%s na aba %s sem violações no axe (escuro: %s)",
    async (role, id, dark, i) => {
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { container } = await setup(role, { enabled: true, required: false, enabledAt: "2026-08-12T15:00:00Z" }, `/conta?aba=${id}`);
      await ready();
      await screen.findByRole("heading", { name: CONTENT[role][i] });
      if (id === "seguranca") await screen.findByText("Safari em iOS");
      expect(document.documentElement.classList.contains("dark")).toBe(dark);
      expect(await axeViolations(container)).toEqual([]);
    },
  );
});

describe("AccountPage do portal: janelas sem violações no axe (CA13)", () => {
  it.each([
    ["Trocar e-mail", false],
    ["Trocar e-mail", true],
    ["Trocar senha", false],
    ["Trocar senha", true],
  ])("janela %s (escuro: %s)", async (name, dark) => {
    setDevicePrefersDark(dark);
    await setup("STUDENT", { enabled: true, required: false, enabledAt: "2026-08-12T15:00:00Z" });
    await ready();
    await userEvent.setup().click(screen.getByRole("button", { name }));
    await screen.findByRole("dialog", { name });
    expect(await axeViolations(document.body)).toEqual([]);
  });
});

describe("AccountPage: Perfil, Meus vínculos (#762 CA5)", () => {
  const base = { unitIds: [], unitNames: ["Centro", "Norte"], studentNames: [] as string[], startsOn: "2026-02-10" as string | null };
  const links: SessionView["links"] = [
    { ...base, id: "l1", organizationId: "o1", organizationName: "Alfa", role: "ADMINISTRATOR" },
    { ...base, id: "l2", organizationId: "o2", organizationName: "Beta", role: "GUARDIAN", studentNames: ["Ana Fictícia", "Beto Fictício"] },
    { ...base, id: "l3", organizationId: "o3", organizationName: "Gama", role: "TEACHER", startsOn: null },
    { ...base, id: "l4", organizationId: "o4", organizationName: "Delta", role: "STUDENT" },
    { ...base, id: "l5", organizationId: "o5", organizationName: "Épsilon", role: "COORDINATOR" },
  ];
  const many = (over: Partial<SessionView> = {}) => http.get("/api/v1/auth/session", () => HttpResponse.json({ ...session("ADMINISTRATOR"), links, ...over }));
  const fields = (item: HTMLElement) => Array.from(item.querySelectorAll("dt"), (dt) => `${dt.textContent}: ${dt.nextElementSibling?.textContent}`);

  it("cada vínculo mostra os campos do papel, sem controle de edição, e há o atalho de troca, que abre a escolha", async () => {
    const user = userEvent.setup();
    await setup("ADMINISTRATOR", OFF, "/conta", [many()]);
    await ready();
    const panel = screen.getByRole("region", { name: "Meus vínculos" });
    const items = within(within(panel).getByRole("list", { name: "Meus vínculos" })).getAllByRole("listitem");
    expect(items.map((i) => i.querySelector("p")?.textContent)).toEqual(["Alfa", "Beta", "Gama", "Delta", "Épsilon"]);
    expect(items.map(fields)).toEqual([
      ["Papel: Administrador", "Unidades: Centro e Norte", "Desde: 10/02/2026"],
      ["Papel: Responsável", "Alunos ligados: Ana Fictícia e Beto Fictício", "Desde: 10/02/2026"],
      ["Papel: Professor", "Unidades: Centro e Norte"],
      ["Papel: Aluno", "Desde: 10/02/2026"],
      ["Papel: Coordenador", "Desde: 10/02/2026"],
    ]);
    expect(within(panel).getAllByRole("button").map((b) => b.textContent)).toEqual(["Trocar organização ou área"]);
    expect(within(panel).queryByRole("link")).not.toBeInTheDocument();
    await user.click(within(panel).getByRole("button", { name: "Trocar organização ou área" }));
    expect(await screen.findByRole("dialog", { name: "Onde você quer entrar?" })).toBeInTheDocument();
  });

  it("com um vínculo só não há atalho; no portal o Perfil não tem outro cartão", async () => {
    await setup("STUDENT", OFF, "/conta");
    await ready();
    const panel = screen.getByRole("tabpanel");
    expect(within(panel).queryByRole("button")).not.toBeInTheDocument();
    expect(panel.querySelectorAll("section")).toHaveLength(1);
  });
});

const ALWAYS = "Sempre enviamos: avisos de segurança da conta e da assinatura";

describe("AccountPage: Notificações do portal (#762 CA8)", () => {
  const PATH = "/conta?aba=notificacoes";
  const URL = "/api/v1/auth/email-preferences";

  it("lê o valor gravado, grava a mudança e mostra a linha Sempre enviamos sem chave", async () => {
    const user = userEvent.setup();
    const puts: unknown[] = [];
    await setup("GUARDIAN", OFF, PATH, [
      http.get(URL, () => HttpResponse.json({ announcements: false })),
      http.put(URL, async ({ request }) => {
        const body = (await request.json()) as { announcements: boolean };
        puts.push(body);
        return HttpResponse.json(body);
      }),
    ]);
    await ready();
    const toggle = await screen.findByRole("switch", { name: "Comunicados da academia" });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(ALWAYS)).toBeInTheDocument();
    expect(within(screen.getByRole("tabpanel")).getAllByRole("switch")).toHaveLength(1);
    await user.click(toggle);
    await waitFor(() => expect(toggle).toBeChecked());
    expect(puts).toEqual([{ announcements: true }]);
  });

  it("falha ao gravar avisa e mantém o valor", async () => {
    await setup("STUDENT", OFF, PATH, [http.put(URL, () => new HttpResponse(null, { status: 500 }))]);
    await ready();
    const toggle = await screen.findByRole("switch", { name: "Comunicados da academia" });
    await userEvent.setup().click(toggle);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar a preferência.");
    expect(toggle).toBeChecked();
  });

  it("carregando e erro com Tentar de novo", async () => {
    const user = userEvent.setup();
    let fail = true;
    let release = () => {};
    const gate = new Promise<void>((r) => (release = r));
    await setup("STUDENT", OFF, PATH, [
      http.get(URL, async () => {
        await gate;
        return fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ announcements: true });
      }),
    ]);
    await ready();
    expect(within(screen.getByRole("tabpanel")).getByRole("status")).toHaveTextContent("Carregando...");
    release();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByRole("switch", { name: "Comunicados da academia" })).toBeChecked();
  });

  it("403 mostra sem permissão", async () => {
    await setup("STUDENT", OFF, PATH, [http.get(URL, () => new HttpResponse(null, { status: 403 }))]);
    await ready();
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});

describe("AccountPage: Privacidade (#762 CA9)", () => {
  it.each([
    ["STUDENT", false, ["Baixar meus dados", "Excluir minha conta"]],
    ["ADMINISTRATOR", false, ["Baixar meus dados"]],
    ["GUARDIAN", true, ["Baixar meus dados", "Excluir minha conta"]],
  ])("%s (abaixo de 640 px: %s): Em breve, desabilitado e sem requisição ao clicar", async (role, narrow, names) => {
    setDeviceNarrow(narrow);
    await setup(role, OFF, "/conta?aba=privacidade");
    await ready();
    const panel = screen.getByRole("tabpanel");
    await new Promise((r) => setTimeout(r, 200)); // deixa as cargas da moldura e das sessões terminarem antes de contar
    // abaixo de 640 px o portal usa as linhas "Em breve" (papel de link)
    const items = within(panel).getAllByRole(narrow ? "link" : "button");
    expect(items.map((i) => i.textContent)).toEqual(names);
    expect(within(panel).getAllByText("Em breve")).toHaveLength(names.length);
    const requests: string[] = [];
    const spy = ({ request }: { request: Request }) => requests.push(request.url);
    server.events.on("request:start", spy);
    const user = userEvent.setup();
    for (const item of items) {
      expect(item).toHaveAttribute("aria-disabled", "true");
      await user.click(item);
    }
    await new Promise((r) => setTimeout(r, 50));
    server.events.removeListener("request:start", spy);
    expect(requests).toEqual([]);
  });
});
