import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import {
  SessionProvider,
  type SessionView,
} from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { Modality, ModalityRequest } from "./useModalities";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [
    {
      id: "l1",
      organizationId: "o",
      organizationName: "Alfa",
      role,
      unitIds: [],
    },
  ],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const modality = (
  id: string,
  name: string,
  active: boolean,
  canManage = true,
  extra: Partial<Modality> = {},
): Modality => ({ id, name, active, canManage, graduationEnabled: false, levelCount: 0, offeredUnits: [], ...extra });

const THREE = ["Boxe Adulto · Noite (Tijuca)", "Boxe Iniciante (Barra)", "Boxe Avançado (Barra)"];
let items: Modality[];
let posts: unknown[];
let blockers: string[];
let blockedStudents: number;

function setup(
  role: string,
  over: { list?: () => Response | Promise<Response> } = {},
) {
  const manage = role === "COORDINATOR";
  items = [
    modality("m1", "Boxe", true, manage, { graduationEnabled: true, levelCount: 19, offeredUnits: ["Tijuca", "Barra"] }),
    modality("m2", "Judô", false, manage),
    modality("m3", "Jiu-Jitsu", false, manage),
  ];
  posts = [];
  blockers = THREE;
  blockedStudents = 63;
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () =>
      HttpResponse.json({ permissions: mockPermissions(role) }),
    ),
    http.get("/api/v1/units/reachable", () =>
      HttpResponse.json({ allUnits: false, units: [] }),
    ),
    http.get(
      "/api/v1/modalities",
      over.list ?? (() => HttpResponse.json(items)),
    ),
    http.put(
      "/api/v1/modalities/:id/activation",
      async ({ request, params }) => {
        const { active } = (await request.json()) as { active: boolean };
        if (params.id === "m1" && !active) {
          return HttpResponse.json(
            {
              code: "MODALITY_IN_USE",
              fields: [
                { field: "activeClasses", message: String(blockers.length) },
                { field: "activeStudents", message: String(blockedStudents) },
                ...blockers.map((message) => ({ field: "class", message })),
              ],
            },
            { status: 409 },
          );
        }
        items = items.map((m) => (m.id === params.id ? { ...m, active } : m));
        return HttpResponse.json(items.find((m) => m.id === params.id));
      },
    ),
    http.post("/api/v1/modalities/requests", async ({ request }) => {
      const body = (await request.json()) as {
        name: string;
        note: string | null;
      };
      posts.push(body);
      if (body.name === "Judo")
        return HttpResponse.json(
          { code: "ALREADY_IN_CATALOG", fields: [] },
          { status: 409 },
        );
      const created: ModalityRequest = {
        id: "r1",
        name: body.name,
        note: body.note,
        status: "OPEN",
        createdAt: "2026-10-19T12:00:00Z",
      };
      return HttpResponse.json(created, { status: 201 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/configuracoes/modalidades"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () =>
  screen.findByRole("heading", { name: "Modalidades", level: 1 });
const block = (name: string) =>
  screen.getByRole("heading", { name }).closest("section")!;
const names = (title: string) =>
  within(block(title)).queryAllByRole("listitem").map((li) => li.querySelector("p")!.textContent);

describe("ModalitiesPage", () => {
  it("CA1, CA2: o Coordenador vê subtítulo, os cartões com a linha de graduação, a nota e o pedido no topo; ativar move o cartão e avisa", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    expect(screen.queryByText(/O Coordenador ativa para a organização/)).toBeNull();
    expect(names("Suas modalidades")).toEqual(["Boxe"]);
    expect(within(block("Suas modalidades")).getByText("Graduação ligada · 19 níveis · Tijuca e Barra")).toBeInTheDocument();
    expect(within(block("Suas modalidades")).getByRole("button", { name: /Graduação\s*Boxe/ })).toBeInTheDocument();
    expect(names("Disponíveis para ativar")).toEqual(["Judô", "Jiu-Jitsu"]);
    expect(within(block("Disponíveis para ativar")).getAllByText("Catálogo ctcore")).toHaveLength(2);
    expect(screen.queryByText(/Variações como No-Gi, Kids ou Competição ficam no nome da turma\./)).toBeNull();
    expect(screen.getByRole("button", { name: "Não achei minha modalidade" })).toBeInTheDocument();
    await user.click(within(block("Disponíveis para ativar")).getByRole("button", { name: /Ativar\s*Judô/ }));
    await waitFor(() => expect(names("Suas modalidades")).toEqual(["Boxe", "Judô"]));
    expect(names("Disponíveis para ativar")).toEqual(["Jiu-Jitsu"]);
    expect(screen.getByRole("status")).toHaveTextContent("Judô ativada.");
  });

  it("CA4: o Administrador vê a faixa e a tabela só de consulta, sem os botões do Coordenador", async () => {
    setup("ADMINISTRATOR");
    await ready();
    expect(screen.queryByText(/Catálogo da organização · só consulta/)).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Quem ativa e desativa modalidades e edita a graduação é o Coordenador.");
    const table = screen.getByRole("table", { name: "Modalidades da organização" });
    const boxe = within(table).getByRole("row", { name: /Boxe/ });
    expect(boxe).toHaveTextContent("Ligada · 19 níveis");
    expect(boxe).toHaveTextContent("Tijuca e Barra");
    expect(boxe).toHaveTextContent("Ativa");
    expect(within(table).getByRole("row", { name: /Judô/ })).toHaveTextContent("Disponível");
    expect(screen.queryByRole("button", { name: /Ativar|Desativar|Não achei/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Suas modalidades" })).toBeNull();
  });

  it("CA1: 'Suas modalidades' vazio orienta a ativar; carregando e erro com nova tentativa", async () => {
    const user = userEvent.setup();
    let calls = 0;
    setup("COORDINATOR", {
      list: () =>
        ++calls === 1
          ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })
          : HttpResponse.json([modality("m2", "Judô", false)]),
    });
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    await ready();
    expect(within(block("Suas modalidades")).getByText(/Ative uma da lista/)).toBeInTheDocument();
  });

  it("CA12: catálogo sem itens mostra o estado vazio", async () => {
    setup("COORDINATOR", { list: () => HttpResponse.json([]) });
    expect(await screen.findByRole("heading", { name: "Nenhuma modalidade no catálogo" })).toBeInTheDocument();
  });

  it("CA12: o 403 do servidor mostra o estado sem permissão", async () => {
    setup("COORDINATOR", { list: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA5, CA2: MODALITY_IN_USE abre a janela com as turmas por unidade e os alunos; 'Entendi' fecha e a modalidade segue ativa", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(within(block("Suas modalidades")).getByRole("button", { name: /Desativar\s*Boxe/ }));
    const dialog = await screen.findByRole("dialog", { name: "Desativar modalidade" });
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Não dá para desativar o Boxe agora");
    expect(dialog).toHaveTextContent("3 turmas ativas: Boxe Adulto · Noite (Tijuca), Boxe Iniciante e Boxe Avançado (Barra)");
    expect(dialog).toHaveTextContent("63 alunos com Boxe ativo");
    expect(dialog).toHaveTextContent("Desative as turmas e encerre ou transfira as matrículas de Boxe antes.");
    expect(dialog.textContent).not.toMatch(/\(s\)/);
    await user.click(within(dialog).getByRole("button", { name: "Entendi" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(names("Suas modalidades")).toEqual(["Boxe"]);
  });

  it("CA5: com uma turma e um aluno o texto fica no singular", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    blockers = ["Boxe Adulto (Tijuca)"];
    blockedStudents = 1;
    await ready();
    await user.click(within(block("Suas modalidades")).getByRole("button", { name: /Desativar\s*Boxe/ }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("1 turma ativa: Boxe Adulto (Tijuca)");
    expect(dialog).toHaveTextContent("1 aluno com Boxe ativo");
  });

  it("CA2: sem impedimento desativa direto, move o cartão e avisa", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    items = [modality("m1", "Boxe", true), modality("m2", "Judô", true)];
    await ready();
    await user.click(within(block("Suas modalidades")).getByRole("button", { name: /Desativar\s*Judô/ }));
    await waitFor(() => expect(names("Disponíveis para ativar")).toEqual(["Judô"]));
    expect(screen.getByRole("status")).toHaveTextContent("Judô desativada.");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("CA3: não há bloco de pedidos; nome curto mostra o erro no campo sem enviar; dados válidos fecham e avisam; 409 aparece no campo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    expect(screen.queryByRole("heading", { name: "Pedidos enviados" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Não achei minha modalidade" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Nome da modalidade"), "a");
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("2 a 60 caracteres");
    expect(posts).toEqual([]);
    const name = within(dialog).getByLabelText("Nome da modalidade");
    await user.clear(name);
    await user.type(name, "Judo");
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    expect(await within(dialog).findByText(/já existe no catálogo/)).toBeInTheDocument();
    await user.clear(name);
    await user.type(name, "Sambo");
    await user.type(within(dialog).getByLabelText("Observação (opcional)"), "Temos turma");
    await user.click(within(dialog).getByRole("button", { name: "Enviar pedido" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(posts.at(-1)).toEqual({ name: "Sambo", note: "Temos turma" });
    expect(screen.getByText("Pedido enviado")).toBeInTheDocument();
    expect(screen.queryByText("Sambo")).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])(
    "CA12: a 360 px não tem violações no axe no tema %s, com a lista, a janela de pedido e a de desativar",
    async (_n, dark) => {
      const user = userEvent.setup();
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { container } = setup("COORDINATOR");
      await ready();
      expect(await axeViolations(container)).toEqual([]);
      await user.click(screen.getByRole("button", { name: "Não achei minha modalidade" }));
      await screen.findByRole("dialog");
      expect(await axeViolations(document.body)).toEqual([]);
      await user.click(screen.getByRole("button", { name: "Cancelar" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await user.click(within(block("Suas modalidades")).getByRole("button", { name: /Desativar\s*Boxe/ }));
      await screen.findByRole("dialog", { name: "Desativar modalidade" });
      expect(await axeViolations(document.body)).toEqual([]);
    },
  );
});
