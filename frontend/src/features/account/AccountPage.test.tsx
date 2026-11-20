import { render, screen, waitFor, within } from "@testing-library/react";
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
async function setup(role = "COORDINATOR", twoFactor: TwoFactor = { enabled: false, required: false }, path = "/conta", extra: Handler[] = [], passwordChangedAt: string | null = "2026-08-12T15:00:00Z") {
  await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "a@b.c", password: "x" }) });
  let current = session(role, twoFactor, passwordChangedAt);
  server.use(
    ...extra,
    portalShellOk,
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
const DUAS = "/conta?aba=duas-etapas";
const SESSOES = "/conta?aba=sessoes";

describe("AccountPage: abas (CA1, CA2)", () => {
  it("o Administrador vê quatro abas com Acesso ativa e o subtítulo; clicar muda a aba e a URL", async () => {
    const user = userEvent.setup();
    await setup("ADMINISTRATOR");
    await ready();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["Acesso", "Duas etapas", "Sessões", "Notificações"]);
    expect(screen.getByRole("tab", { name: "Acesso", selected: true })).toBeInTheDocument();
    expect(screen.getByText("X · Administrador da Centro")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Notificações" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/conta?aba=notificacoes");
    expect(await screen.findByText("Sino da gestão")).toBeInTheDocument();
  });

  it("abre direto na aba da URL e as setas, Home e End movem o foco", async () => {
    const user = userEvent.setup();
    await setup("ADMINISTRATOR", { enabled: false, required: false }, SESSOES);
    await ready();
    expect(screen.getByRole("tab", { name: "Sessões", selected: true })).toBeInTheDocument();
    screen.getByRole("tab", { name: "Sessões" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Notificações" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Acesso" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Notificações" })).toHaveFocus();
  });

  it("o Aluno continua com a página de antes, sem abas", async () => {
    await setup("STUDENT");
    await ready();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Minha conta" })).toBeInTheDocument();
    expect(screen.getByText("Minhas informações", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Minhas informações", current: "page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/portal/minhas-informacoes");
    for (const name of ["Acesso", "Verificação em duas etapas", "Sessões ativas", "Baixar meus dados", "Excluir minha conta"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    expect(screen.getByText("Opcional para alunos")).toBeInTheDocument();
    expect(screen.getByText("No portal, a sessão dura 30 dias.")).toBeInTheDocument();
    for (const name of ["Baixar meus dados", "Excluir minha conta"]) expect(screen.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Em breve").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });
});

describe("AccountPage: cartão Acesso (CA3)", () => {
  it("mostra o e-mail e a data da senha, ou 'nunca alterada'", async () => {
    const first = await setup();
    await ready();
    expect(screen.getByText("x@x.com")).toBeInTheDocument();
    expect(screen.getByText("alterada em 12/08/2026")).toBeInTheDocument();
    expect(screen.getByText(/O novo e-mail só vale depois de confirmado pelo link \(24 horas\)/)).toBeInTheDocument();
    first.unmount();
    await setup("COORDINATOR", { enabled: false, required: false }, "/conta", [], null);
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
    await setup("ADMINISTRATOR", { enabled: true, required: false }, "/conta", [
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
    await setup("COORDINATOR", { enabled: true, required: true, enabledAt: "2026-08-12T15:00:00Z" }, DUAS);
    await ready();
    expect(screen.getByText("Ativa")).toBeInTheDocument();
    expect(screen.getByText("app autenticador · ativada em 12/08/2026")).toBeInTheDocument();
    expect(screen.getByText("Opcional para Administradores. Obrigatória para o Coordenador.")).toBeInTheDocument();
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
    const { setSession } = await setup("ADMINISTRATOR", { enabled: false, required: false }, DUAS);
    await ready();
    expect(screen.getByText("Desligada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ativar duas etapas" }));
    await user.click(await screen.findByRole("button", { name: "Agora não" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ativar duas etapas" }));
    await user.type(await screen.findByLabelText("Digite o código de 6 números que aparece no app"), "123456");
    setSession(session("ADMINISTRATOR", { enabled: true, required: false, enabledAt: "2026-11-18T15:00:00Z" }));
    await user.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(within(await screen.findByRole("list", { name: "Seus códigos de reserva" })).getAllByRole("listitem")).toHaveLength(10);
    await user.click(screen.getByLabelText("Guardei os códigos em lugar seguro"));
    await user.click(screen.getByRole("button", { name: "Concluir" }));
    expect(await screen.findByText("Ativa")).toBeInTheDocument();
  });

  it("desliga com senha e código; erros aparecem nos campos", async () => {
    const user = userEvent.setup();
    const { setSession } = await setup("ADMINISTRATOR", { enabled: true, required: false, enabledAt: "2026-08-12T15:00:00Z" }, DUAS);
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
    await setup("ADMINISTRATOR", { enabled: true, required: false, enabledAt: "2026-08-12T15:00:00Z" }, DUAS);
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
    await setup("COORDINATOR", { enabled: false, required: false }, SESSOES);
    await ready();
    expect(await screen.findByText("Este aparelho")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Aparelho", "Local", "Último uso", "Ações"]);
    expect(screen.getAllByText("Este aparelho")).toHaveLength(1);
    expect(screen.getByText("Sessões da gestão duram 12 horas; do portal, 30 dias.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Encerrar a sessão em/ })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Encerrar a sessão em Safari em iOS" }));
    await waitFor(() => expect(screen.queryByText("Safari em iOS")).not.toBeInTheDocument());
    expect(screen.getByText("Não há outras sessões ativas.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Encerrar todas as outras" })).not.toBeInTheDocument();
  });

  it("encerra todas as outras só depois da confirmação", async () => {
    const user = userEvent.setup();
    await setup("COORDINATOR", { enabled: false, required: false }, SESSOES);
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
    await setup("COORDINATOR", { enabled: false, required: false }, SESSOES, [http.delete("/api/v1/auth/sessions/:id", () => new HttpResponse(null, { status: 500 }))]);
    await ready();
    await user.click(await screen.findByRole("button", { name: "Encerrar a sessão em Safari em iOS" }));
    expect(await screen.findByText("Não conseguimos encerrar a sessão. Tente de novo.")).toBeInTheDocument();
  });

  it("abaixo de 640 px a lista vira cartões, sem tabela", async () => {
    setDeviceNarrow(true);
    window.innerWidth = 360;
    await setup("COORDINATOR", { enabled: false, required: false }, SESSOES);
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
    await setup("COORDINATOR", { enabled: false, required: false }, SESSOES, [
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
    await setup("COORDINATOR", { enabled: false, required: false }, "/conta", [
      http.get("/api/v1/auth/sessions", () => HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 })),
      http.get("/api/v1/auth/session", () => (calls++ === 0 ? HttpResponse.json(session("COORDINATOR")) : HttpResponse.json({ code: "UNAUTHENTICATED" }, { status: 401 }))),
    ]);
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
  });
});

describe("AccountPage: lista do celular (CA12)", () => {
  it("a 390 px sem ?aba= mostra a lista de atalhos com Sair e sem abas; tocar abre a aba com seta de voltar", async () => {
    const user = userEvent.setup();
    setDeviceNarrow(true);
    window.innerWidth = 390;
    await setup("COORDINATOR", { enabled: true, required: true, enabledAt: "2026-08-12T15:00:00Z" });
    await ready();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByText("Coordenador · Centro")).toBeInTheDocument();
    expect(screen.getByText("Ligada")).toBeInTheDocument();
    expect(screen.getByText(/alterada há \d+ meses?/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Sair/ }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("link", { name: /Sessões ativas/ }));
    expect(screen.getByTestId("where")).toHaveTextContent("/conta?aba=sessoes");
    expect(await screen.findByText("Este aparelho")).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Voltar para Minha conta" }));
    expect(screen.getByTestId("where")).toHaveTextContent(/^\/conta$/);
    expect(await screen.findByText("Duas etapas")).toBeInTheDocument();
  });

  it("Sair encerra a sessão e volta ao login", async () => {
    const user = userEvent.setup();
    setDeviceNarrow(true);
    window.innerWidth = 390;
    await setup("COORDINATOR");
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

describe("AccountPage: acessibilidade em 360 px (CA13)", () => {
  it.each([
    ["gestão", "COORDINATOR", false, "/conta?aba=acesso"],
    ["gestão", "COORDINATOR", true, "/conta?aba=acesso"],
    ["gestão", "ADMINISTRATOR", false, SESSOES],
    ["gestão", "ADMINISTRATOR", true, DUAS],
    ["gestão", "COORDINATOR", false, "/conta?aba=notificacoes"],
    ["portal", "STUDENT", false, "/conta"],
    ["portal", "GUARDIAN", true, "/conta"],
  ])("perfil de %s (%s) sem violações no axe (escuro: %s, %s)", async (_n, role, dark, path) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = await setup(role, { enabled: true, required: role === "COORDINATOR", enabledAt: "2026-08-12T15:00:00Z" }, path);
    await ready();
    if (path.includes("sessoes") || role === "STUDENT" || role === "GUARDIAN") await screen.findByText("Safari em iOS");
    if (path.includes("notificacoes")) await screen.findByText("Sino da gestão");
    expect(document.documentElement.classList.contains("dark")).toBe(dark);
    expect(await axeViolations(container)).toEqual([]);
  });
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
