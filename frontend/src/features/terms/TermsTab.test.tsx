import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { LocationProbe, currentLocation } from "@/test/location";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { TermsVersion, TermsView } from "./useTerms";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const MODEL: TermsVersion = { version: 0, body: "Texto padrão da plataforma para o termo.", reaccept: false, publishedAt: null, publishedBy: null, acceptances: 0 };
const v1: TermsVersion = { version: 1, body: "Primeira versão publicada do termo.", reaccept: false, publishedAt: "2026-03-01T12:00:00Z", publishedBy: "Ana", acceptances: 96 };

let versions: TermsVersion[];
let posts: { kind: string; body: { body: string; reaccept: boolean } }[];

const view = (role: string): TermsView => ({ canManage: role === "COORDINATOR", current: versions[0] ?? MODEL, versions });

function setup(role: string, over: { get?: () => Response | Promise<Response>; post?: (n: number) => Response | undefined; initial?: TermsVersion[]; at?: string } = {}) {
  versions = over.initial ?? [];
  posts = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
    http.get("/api/v1/organization/terms/:kind", over.get ?? (() => HttpResponse.json(view(role)))),
    http.post("/api/v1/organization/terms/:kind/versions", async ({ request, params }) => {
      const body = (await request.json()) as { body: string; reaccept: boolean };
      posts.push({ kind: params.kind as string, body });
      const failure = over.post?.(posts.length);
      if (failure) return failure;
      const created = { version: (versions[0]?.version ?? 0) + 1, body: body.body, reaccept: body.reaccept, publishedAt: "2026-04-01T12:00:00Z", publishedBy: "X", acceptances: 0 };
      versions = [created, ...versions];
      return HttpResponse.json(created, { status: 201 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[over.at ?? "/configuracoes/organizacao?aba=termos"]}>
        <LocationProbe />
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = async () => {
  await screen.findByRole("heading", { name: "Organização", level: 1 });
  // O título é o mesmo em todas as abas: espera o conteúdo da aba.
  await waitFor(() => expect(screen.queryByText("Carregando...")).toBeNull());
};
const editor = () => screen.findByLabelText("Texto do termo");
const publishButton = () => screen.getByRole("button", { name: /^Publicar versão [0-9]+$/ });

describe("TermsTab", () => {
  it("CA9: sem versão publicada mostra o histórico vazio e o texto padrão no editor; publicar começa desabilitado", async () => {
    setup("COORDINATOR");
    await ready();
    expect(await editor()).toHaveValue(MODEL.body);
    expect(screen.getByRole("heading", { name: "Nenhuma versão publicada ainda" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Só para novos alunos/)).not.toBeChecked();
    expect(screen.getByLabelText(/Todos aceitam de novo/)).not.toBeChecked();
    expect(publishButton()).toBeDisabled();
  });

  it("CA9: publica com a escolha de reaceite; a atual e o histórico se atualizam sem recarregar; o botão volta a desabilitar", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", { initial: [v1] });
    const box = await editor();
    expect(box).toHaveValue(v1.body);
    expect(publishButton()).toBeDisabled();
    await user.clear(box);
    await user.type(box, "Segunda versão do termo, com mais texto.");
    expect(publishButton()).toBeDisabled();
    await user.click(screen.getByLabelText(/Todos aceitam de novo/));
    expect(publishButton()).toBeEnabled();
    await user.click(publishButton());
    expect(await screen.findByText("Nova versão publicada.")).toBeInTheDocument();
    expect(posts).toEqual([{ kind: "ENROLLMENT", body: { body: "Segunda versão do termo, com mais texto.", reaccept: true } }]);
    expect(screen.getByText(/Versão 2 publicada em/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar versão 3" })).toBeDisabled();
    expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "96" })).toBeInTheDocument();
    expect(publishButton()).toBeDisabled();
  });

  it("CA9: a aba do termo de uso de imagem lê e publica o outro tipo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("tab", { name: "Uso de imagem" }));
    const box = await editor();
    await user.clear(box);
    await user.type(box, "Texto novo do termo de imagem.");
    await user.click(screen.getByLabelText(/Só para novos alunos/));
    await user.click(screen.getByRole("button", { name: "Publicar versão 1" }));
    await screen.findByText("Nova versão publicada.");
    expect(posts[0].kind).toBe("IMAGE_USE");
  });

  it("CA9: erro 400 e 409 do servidor aparecem na tela", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", {
      post: (n) => HttpResponse.json({ code: n === 1 ? "VALIDATION_ERROR" : "TERMS_VERSION_CONFLICT", fields: [] }, { status: n === 1 ? 400 : 409 }),
    });
    const box = await editor();
    await user.clear(box);
    await user.type(box, "Texto novo com mais de vinte letras.");
    await user.click(screen.getByLabelText(/Só para novos alunos/));
    await user.click(publishButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("de 20 a 20000 caracteres");
    await user.click(publishButton());
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Outra pessoa publicou"));
    expect(versions).toEqual([]);
  });

  it("CA9: o Administrador vê o texto e o histórico, sem editor, rascunho, botão nem escolha", async () => {
    setup("ADMINISTRATOR", { initial: [v1] });
    await ready();
    expect(await screen.findByRole("cell", { name: "96" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Texto do termo")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Publicar versão/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Salvar rascunho/ })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText(v1.body)).toBeInTheDocument();
    expect(screen.queryByText(/O uso de imagem é uma caixa separada/)).not.toBeInTheDocument();
  });

  it("CA1, CA2, CA3, CA6: sem subtítulo, abas com sublinhado, barra desabilitada, linha da versão e rodapé lado a lado; sem nota nas duas abas", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", { initial: [v1] });
    await ready();
    expect(screen.queryByText(/cada alteração vira uma nova versão/)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Termo de matrícula" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("toolbar", { name: "Formatação do texto" })).toHaveTextContent("Lista");
    expect(screen.getByRole("button", { name: "Lista" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/Versão 1 publicada em .+ por Ana/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar rascunho" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Publicar versão 2" })).toBeInTheDocument();
    expect(screen.queryByText(/O uso de imagem é uma caixa separada/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Uso de imagem" }));
    expect(await screen.findByRole("tab", { name: "Uso de imagem", selected: true })).toBeInTheDocument();
    expect(screen.queryByText(/O uso de imagem é uma caixa separada/)).not.toBeInTheDocument();
  });

  it("CA3: sem versão publicada, a linha traz a mensagem do texto padrão e o botão é Publicar versão 1", async () => {
    setup("COORDINATOR");
    await ready();
    expect(await screen.findByText(/Ainda não há versão publicada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publicar versão 1" })).toBeDisabled();
    expect(screen.getByText("Ao publicar a versão 1")).toBeInTheDocument();
  });

  it("CA5, CA13: a tabela mostra versão, data e aceites; as opções são botões de opção do componente base", async () => {
    const mk = (version: number, acceptances: number): TermsVersion => ({ ...v1, version, acceptances });
    setup("COORDINATOR", { initial: [mk(3, 187), mk(2, 142), mk(1, 96)] });
    await editor();
    const rows = screen.getAllByRole("row").slice(1).map((r) => r.textContent);
    expect(rows).toEqual(["301/03/2026187", "201/03/2026142", "101/03/202696"]);
    expect(screen.getAllByRole("radio")).toHaveLength(2);
    expect(screen.getByText("Quem já aceitou continua na versão 3")).toBeInTheDocument();
  });

  it("CA9: carregando, erro com nova tentativa e sem permissão", async () => {
    const user = userEvent.setup();
    let calls = 0;
    setup("COORDINATOR", { get: () => (++calls === 1 ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(view("COORDINATOR"))) });
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    expect(screen.getByRole("tablist", { name: "Seções da organização" })).toBeInTheDocument();
    await user.click(retry);
    expect(await editor()).toBeInTheDocument();
  });

  it("CA9: o 403 do servidor mostra o estado sem permissão", async () => {
    setup("COORDINATOR", { get: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Seções da organização" })).toBeInTheDocument();
  });

  it("#747 CA4: o tipo de termo fica em ?termo= sem sair da aba, vale depois de recarregar e o inválido é o de matrícula", async () => {
    const user = userEvent.setup();
    const first = setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("tab", { name: "Uso de imagem" }));
    expect(currentLocation().search).toBe("?aba=termos&termo=IMAGE_USE");
    expect(screen.getByRole("tab", { name: "Termos" })).toHaveAttribute("aria-selected", "true");
    first.unmount();
    for (const [at, kind] of [
      ["/configuracoes/organizacao?aba=termos&termo=IMAGE_USE", "Uso de imagem"],
      ["/configuracoes/organizacao?aba=termos&termo=nada", "Termo de matrícula"],
      ["/configuracoes/termos?aba=IMAGE_USE", "Termo de matrícula"], // D4: a busca do endereço antigo é descartada
    ]) {
      const view = setup("COORDINATOR", { at });
      await ready();
      expect(screen.getByRole("tab", { name: kind })).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tab", { name: "Termos" })).toHaveAttribute("aria-selected", "true");
      view.unmount();
    }
  });

  it("#747 CA5, CA6: o endereço antigo leva à aba Termos, com Organização marcada no menu; Professor não entra", async () => {
    for (const role of ["COORDINATOR", "ADMINISTRATOR"]) {
      const view = setup(role, { at: "/configuracoes/termos" });
      await ready();
      expect(currentLocation().pathname + currentLocation().search).toBe("/configuracoes/organizacao?aba=termos");
      expect(screen.getByRole("tab", { name: "Termos" })).toHaveAttribute("aria-selected", "true");
      expect(screen.getAllByRole("link", { name: "Organização" })[0]).toHaveAttribute("aria-current", "page");
      expect(screen.queryByRole("link", { name: "Termos" })).toBeNull();
      view.unmount();
    }
    for (const at of ["/configuracoes/termos", "/configuracoes/organizacao?aba=termos"]) {
      const view = setup("TEACHER", { at });
      expect(await screen.findByRole("heading", { name: "Esta área não está disponível para o seu perfil" })).toBeInTheDocument();
      expect(screen.queryByRole("tablist")).toBeNull();
      view.unmount();
    }
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA9: a 360 px não tem violações no axe no tema %s, para quem edita e para quem consulta", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const first = setup("COORDINATOR", { initial: [v1] });
    await editor();
    expect(await axeViolations(first.container)).toEqual([]);
    first.unmount();
    const second = setup("ADMINISTRATOR", { initial: [v1] });
    await screen.findByRole("cell", { name: "96" });
    expect(await axeViolations(second.container)).toEqual([]);
  });
});
