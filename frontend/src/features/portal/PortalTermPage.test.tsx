import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { portalShellOk } from "@/test/portalShell";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { PortalTermPending } from "./usePortalTerm";

// O Início do portal (#89) lê /portal/home; estes testes só olham a moldura e o termo.
const emptyHome = { reduced: false, students: [], familyOpenCents: 0, selectedStudentId: null, charges: { items: [], nextDueOn: null }, lessons: [], announcements: { unreadCount: 0, items: [] }, belts: [] };

const session = (role: string, name = "X"): SessionView => ({
  account: { id: "a", email: "x@x.com", name },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const pending: PortalTermPending = {
  id: "s1",
  name: "Aluno Fictício",
  term: { version: 1, body: "Texto do termo.\nSegunda linha." },
  imageUse: { version: 1, body: "Texto do uso de imagem.", granted: false },
};

let list: PortalTermPending[];
let posts: { id: string; body: { version: number; imageUse: boolean } }[];

function setup(over: { role?: string; name?: string; initial?: PortalTermPending[]; get?: () => Response; post?: () => Response | undefined; path?: string } = {}) {
  list = over.initial ?? [pending];
  posts = [];
  server.use(
    portalShellOk, // só a tela inicial, depois do aceite, lê a moldura
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(over.role ?? "STUDENT", over.name))),
    http.get("/api/v1/portal/term", over.get ?? (() => HttpResponse.json(list))),
    http.get("/api/v1/portal/modality-confirmations", () => HttpResponse.json([])),
    http.get("/api/v1/portal/home", () => HttpResponse.json(emptyHome)),
    http.post("/api/v1/portal/students/:id/term-acceptance", async ({ request, params }) => {
      const failure = over.post?.();
      if (failure) return failure;
      posts.push({ id: params.id as string, body: (await request.json()) as { version: number; imageUse: boolean } });
      list = list.filter((p) => p.id !== params.id);
      return HttpResponse.json({ studentId: params.id, version: 1, imageUse: false }, { status: 201 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[over.path ?? "/portal/termo"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
const heading = () => screen.findByRole("heading", { name: "Termo de matrícula", level: 1 });

describe("PortalTermPage (RN-MAT-11, RN-POR-03)", () => {
  it("mostra o termo, aceita com a caixa de imagem separada e segue para o início", async () => {
    setup();
    await heading();
    expect(await screen.findByText(/Texto do termo\./)).toBeInTheDocument();
    const read = screen.getByLabelText("Li e aceito o termo de matrícula");
    const image = screen.getByLabelText(/Autorizo o uso de imagem/);
    expect(image).not.toBeChecked();
    const submit = screen.getByRole("button", { name: "Aceitar e continuar" });
    expect(submit).toBeDisabled();
    await userEvent.click(read);
    await userEvent.click(image);
    await userEvent.click(submit);
    await screen.findByRole("heading", { name: /^Olá/, level: 1 });
    expect(posts).toEqual([{ id: "s1", body: { version: 1, imageUse: true } }]);
  });

  it("mostra marca, abertura, termo rolável com versão, Baixar PDF em breve e as dicas (R1 a R4)", async () => {
    setup();
    await heading();
    expect(screen.getByText("Antes de começar")).toBeInTheDocument();
    expect(screen.getByTestId("term-bar")).toHaveClass("md:hidden"); // barra só no celular (R1)
    expect(screen.getByText("Leia e aceite o termo de matrícula da Alfa para liberar o portal.")).toBeInTheDocument();
    const region = await screen.findByRole("region", { name: "Termo de matrícula · versão 1" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("Versão 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar PDF" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    expect(screen.getByLabelText("Li e aceito o termo de matrícula")).toHaveAccessibleDescription("Fica registrado com data, hora e versão");
    expect(screen.getByLabelText("Autorizo o uso de imagem de Aluno Fictício (opcional)")).toHaveAccessibleDescription(/Texto do uso de imagem. Você pode revogar depois em Minhas informações./);
    expect(screen.queryByRole("heading", { name: /Uso de imagem/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Autorizo o uso de imagem/));
    expect(screen.getByRole("button", { name: "Aceitar e continuar" })).toBeDisabled();
  });

  it("responsável com um aluno recebe a abertura personalizada", async () => {
    setup({ role: "GUARDIAN", name: "Juliana Souza", initial: [{ ...pending, name: "Theo" }] });
    expect(await screen.findByText("Olá, Juliana! Para liberar o portal de Theo, leia e aceite o termo de matrícula da Alfa.")).toBeInTheDocument();
  });

  it("Sair encerra a sessão e leva ao login", async () => {
    server.use(http.post("/api/v1/auth/logout", () => new HttpResponse(null, { status: 204 })));
    setup();
    await heading();
    await userEvent.click(await screen.findByRole("button", { name: "Sair" }));
    await screen.findByRole("button", { name: "Entrar" });
  });

  it("dois filhos pendentes: progresso, um termo por vez e Início no fim (R6)", async () => {
    const lia = { ...pending, id: "s2", name: "Lia Nogueira" };
    const davi = { ...pending, id: "s1", name: "Davi Nogueira" };
    setup({ role: "GUARDIAN", name: "Juliana Souza", initial: [davi, lia] });
    expect(await screen.findByText("0 de 2 aceitos")).toBeInTheDocument();
    expect(screen.getByText("Você é responsável por 2 alunos com termo pendente. O portal libera depois que você aceitar por todos.")).toBeInTheDocument();
    expect(screen.getAllByText("Falta aceitar")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Aceitar e continuar" })).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Termo de matrícula · Davi Nogueira · versão 1" })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Li e aceito o termo de matrícula"));
    await userEvent.click(screen.getByLabelText(/Autorizo o uso de imagem de Davi/));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
    expect(await screen.findByText("1 de 2 aceitos")).toBeInTheDocument();
    expect(screen.getByText("Aceito agora")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Termo de matrícula · Lia Nogueira · versão 1" })).toBeInTheDocument();
    expect(screen.getByLabelText("Li e aceito o termo de matrícula")).not.toBeChecked();
    expect(screen.getByLabelText(/Autorizo o uso de imagem de Lia/)).not.toBeChecked();
    await userEvent.click(screen.getByLabelText("Li e aceito o termo de matrícula"));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
    await screen.findByRole("heading", { name: /^Olá/, level: 1 });
    expect(posts.map((p) => p.id)).toEqual(["s1", "s2"]);
  });

  it("sem aceite do uso de imagem, imageUse segue falso", async () => {
    setup();
    await heading();
    await userEvent.click(await screen.findByLabelText("Li e aceito o termo de matrícula"));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
    await screen.findByRole("heading", { name: /^Olá/, level: 1 });
    expect(posts[0].body.imageUse).toBe(false);
  });

  it("portal com termo pendente leva de qualquer tela ao aceite", async () => {
    setup({ path: "/" });
    await heading();
  });

  it("sem pendência a tela inicial abre; a tela de aceite mostra o vazio", async () => {
    setup({ initial: [], path: "/" });
    await screen.findByRole("heading", { name: /^Olá/, level: 1 });
  });

  it("vazio, erro com nova tentativa e sem permissão", async () => {
    const empty = setup({ initial: [] });
    expect(await screen.findByRole("heading", { name: "Nenhum termo para aceitar" })).toBeInTheDocument();
    empty.unmount();

    let calls = 0;
    const failing = setup({ get: () => (++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([pending])) });
    await userEvent.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    await screen.findByText(/Texto do termo\./);
    failing.unmount();

    setup({ role: "GUARDIAN", get: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("termo que mudou (409) avisa e mantém a tela", async () => {
    setup({ post: () => HttpResponse.json({ code: "TERMS_VERSION_CONFLICT" }, { status: 409 }) });
    await heading();
    await userEvent.click(await screen.findByLabelText("Li e aceito o termo de matrícula"));
    await userEvent.click(screen.getByRole("button", { name: "Aceitar e continuar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("O termo mudou");
    await waitFor(() => expect(screen.getByRole("button", { name: "Aceitar e continuar" })).toBeEnabled());
  });

  it.each([false, true])("passa no axe (escuro: %s)", async (dark) => {
    setDevicePrefersDark(dark);
    const { container } = setup();
    await screen.findByText(/Texto do termo\./);
    expect(await axeViolations(container)).toEqual([]);
  });
});
