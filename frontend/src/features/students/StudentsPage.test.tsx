import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expectPillOptions, pickPill } from "@/test/pill";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { StudentRow } from "./types";

const session = (role: string, accountId = "a"): SessionView => ({
  account: { id: accountId, email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const student = (over: Partial<StudentRow>): StudentRow => ({
  id: "s1",
  name: "Ana Souza",
  photoUrl: null,
  birthDate: "2014-05-02",
  age: 12,
  minor: true,
  ageRange: { id: "r1", name: "Infantil" },
  registeredUnit: { id: "u1", name: "Centro" },
  createdAt: "2026-01-10T12:00:00Z",
  seals: [],
  status: "NONE",
  financialStatus: "CURRENT",
  modalities: [],
  ...over,
});
const bjj = { id: "mod1", unit: { id: "u1", name: "Centro" }, modality: { id: "m1", name: "Jiu-Jitsu" }, primaryClass: { id: "k1", name: "Turma Noite" }, level: null };
const judo = { id: "mod2", unit: { id: "u2", name: "Norte" }, modality: { id: "m3", name: "Judô" }, primaryClass: { id: "k2", name: "Turma Manhã" }, level: null };
const all = [student({ seals: ["INCOMPLETE_REGISTRATION", "BIRTHDAY_TODAY"], status: "ACTIVE", modalities: [bjj, judo] }), student({ id: "s2", name: "João Pereira", birthDate: "1990-03-10", age: 36, minor: false, ageRange: null, registeredUnit: { id: "u2", name: "Norte" } })];

let calls: URLSearchParams[];

function setup(role = "COORDINATOR", list?: () => Response | Promise<Response>, accountId = "a", url = "/alunos") {
  calls = [];
  window.history.replaceState(null, "", url);
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role, accountId))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }, { id: "u2", name: "Norte", shortName: "n" }] })),
    http.get("/api/v1/age-ranges", () => HttpResponse.json({ canManage: false, items: [{ id: "r1", name: "Infantil", minAge: 4, maxAge: 12 }, { id: "r2", name: "Adulto", minAge: 18, maxAge: null }] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([{ id: "m1", name: "Jiu-Jitsu", active: true }, { id: "m2", name: "Boxe", active: false }, { id: "m3", name: "Judô", active: true }])),
    http.get("/api/v1/classes", () => HttpResponse.json({ items: [{ id: "k1", name: "Turma Noite" }, { id: "k2", name: "Turma Manhã" }], page: 1, size: 100, total: 2 })),
    http.get("/api/v1/modalities/:id/graduation", () => HttpResponse.json({ enabled: true, requireOriginProof: false, canManage: false, levels: [{ id: "l1", name: "Azul", color: "#0000CD", secondaryColor: null, maxDegree: 4, minAge: 16, maxAge: null, kids: false }] })),
    http.get("/api/v1/students", ({ request }) => {
      const p = new URL(request.url).searchParams;
      calls.push(p);
      if (list) return list();
      const q = (p.get("q") ?? "").toLowerCase();
      const items = all.filter((s) => s.name.toLowerCase().includes(q));
      return HttpResponse.json({ items, page: 1, size: 25, total: items.length, counts: { active: 3, former: 1, overdue: 2 } });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[url]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Alunos", level: 1 });

describe("StudentsPage", () => {
  beforeEach(() => localStorage.clear());

  it("CA9: lista nome, unidade, idade, faixa e data; iniciais sem foto; traço sem faixa; pede a página 25 por nome", async () => {
    setup();
    await ready();
    const row = (await screen.findByText("Ana Souza")).closest("tr")!;
    expect(within(row).getByText("AS")).toBeInTheDocument();
    expect(within(row).getByText("12 anos · Centro")).toBeInTheDocument();
    expect(within(row).getByText("Centro")).toBeInTheDocument();
    expect(within(row).getByText("12 anos")).toBeInTheDocument();
    expect(within(row).getByText("Infantil")).toBeInTheDocument();
    expect(within(row).getByText("10/01/2026")).toBeInTheDocument();
    const other = screen.getByText("João Pereira").closest("tr")!;
    // Faixa, modalidades e graduação vazias.
    expect(within(other).getAllByText("—")).toHaveLength(3);
    expect(calls.at(-1)!.get("page")).toBe("1");
    expect(calls.at(-1)!.get("size")).toBe("25");
    expect(calls.at(-1)!.get("sort")).toBe("name");
  });

  it("CA9: foto aparece quando há URL", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ items: [student({ photoUrl: "https://files.example/foto.png" })], page: 1, size: 25, total: 1 }));
    await screen.findByText("Ana Souza");
    expect(document.querySelector("img[src='https://files.example/foto.png']")).not.toBeNull();
    expect(screen.queryByText("AS")).toBeNull();
  });

  it("CA9: filtros de unidade e faixa e a busca refazem a consulta e combinam", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Ana Souza");
    await expectPillOptions(user, "Unidade", ["Todas", "Centro", "Norte"]);
    await user.click(screen.getByRole("option", { name: "Norte" }));
    await waitFor(() => expect(calls.at(-1)!.get("unitId")).toBe("u2"));
    await expectPillOptions(user, "Faixa etária", ["Todas", "Infantil", "Adulto"]);
    await user.click(screen.getByRole("option", { name: "Adulto" }));
    await waitFor(() => expect(calls.at(-1)!.get("ageRangeId")).toBe("r2"));
    await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "joao");
    await waitFor(() => expect(calls.at(-1)!.get("q")).toBe("joao"));
    expect(calls.at(-1)!.get("unitId")).toBe("u2");
  });

  it("CA9: selos aparecem como texto junto ao nome e o filtro Selo refaz a consulta e some em Limpar filtros", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () =>
      HttpResponse.json({ items: calls.at(-1)!.get("seal") ? [] : all, page: 1, size: 25, total: calls.at(-1)!.get("seal") ? 0 : all.length }),
    );
    await screen.findByText("Ana Souza");
    const badges = (text: string) => screen.queryAllByText(text);
    expect(badges("Cadastro incompleto")).toHaveLength(1);
    expect(badges("Aniversário hoje")).toHaveLength(1);
    expect(badges("E-mail com problema")).toHaveLength(0);
    await expectPillOptions(user, "Selos", ["Todos", "Cadastro incompleto", "E-mail com problema", "Aniversário hoje", "Novo", "Bolsista", "Termo pendente"]);
    await user.click(screen.getByRole("option", { name: "E-mail com problema" }));
    await waitFor(() => expect(calls.at(-1)!.get("seal")).toBe("EMAIL_PROBLEM"));
    await user.click(await screen.findByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(calls.at(-1)!.get("seal")).toBeNull());
  });

  it("CA3 (#446): /alunos?classId=k1 consulta com classId e mostra a turma selecionada", async () => {
    setup("COORDINATOR", undefined, "a", "/alunos?classId=k1");
    await screen.findByText("Ana Souza");
    await waitFor(() => expect(calls.at(-1)!.get("classId")).toBe("k1"));
    expect(screen.getByRole("button", { name: /^Turma/ })).toHaveTextContent("Turma Noite");
  });

  it("CA27: a linha mostra todas as modalidades ativas com unidade e turma principal e a situação; sem matrícula, traço e Sem matrícula", async () => {
    setup();
    const row = (await screen.findByText("Ana Souza")).closest("tr")!;
    expect(within(row).getByText("Jiu-Jitsu")).toBeInTheDocument();
    expect(within(row).getByText("Turma Noite")).toBeInTheDocument();
    expect(within(row).getByText("Judô")).toBeInTheDocument();
    expect(within(row).getByText("Turma Manhã")).toBeInTheDocument();
    expect(within(row).getByText("Ativo")).toBeInTheDocument();
    expect(within(screen.getByText("João Pereira").closest("tr")!).getByText("Sem matrícula")).toBeInTheDocument();
  });

  it("CA27: selo Novo aparece como texto junto ao nome e filtra por selo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () => HttpResponse.json({ items: [student({ seals: ["NEW"] })], page: 1, size: 25, total: 1, counts: { active: 1, former: 0 } }));
    await screen.findByText("Ana Souza");
    expect(screen.getAllByText("Novo").length).toBeGreaterThan(0);
    await pickPill(user, "Selos", "Novo");
    await waitFor(() => expect(calls.at(-1)!.get("seal")).toBe("NEW"));
  });

  it("CA28: filtros de modalidade, turma e nível refazem a consulta e combinam; o nível só abre com a modalidade e vem da graduação dela", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Ana Souza");
    await expectPillOptions(user, "Modalidade", ["Todas", "Jiu-Jitsu", "Judô"]);
    await user.keyboard("{Escape}");
    await expectPillOptions(user, "Turma", ["Todas", "Turma Noite", "Turma Manhã"]);
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /^Nível/ })).toBeDisabled();
    await pickPill(user, "Modalidade", "Jiu-Jitsu");
    await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBe("m1"));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Nível/ })).toBeEnabled());
    await expectPillOptions(user, "Nível", ["Todos", "Azul"]);
    await user.click(screen.getByRole("option", { name: "Azul" }));
    await waitFor(() => expect(calls.at(-1)!.get("levelId")).toBe("l1"));
    await pickPill(user, "Turma", "Turma Noite");
    await waitFor(() => expect(calls.at(-1)!.get("classId")).toBe("k1"));
    expect(calls.at(-1)!.get("modalityId")).toBe("m1");
    expect(calls.at(-1)!.get("levelId")).toBe("l1");
    // Trocar a modalidade limpa o nível.
    await pickPill(user, "Modalidade", "Judô");
    await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBe("m3"));
    expect(calls.at(-1)!.get("levelId")).toBeNull();
  });

  it("CA20: a coluna Situação financeira mostra Em atraso e Em dia e o atalho Em atraso (N) filtra e se desliga", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () => HttpResponse.json({ items: [student({ financialStatus: "OVERDUE" }), student({ id: "s2", name: "João Pereira", financialStatus: "CURRENT" })], page: 1, size: 25, total: 2, counts: { active: 3, former: 1, overdue: 2 } }));
    const row = (await screen.findByText("Ana Souza")).closest("tr")!;
    expect(within(row).getByText("Em atraso")).toBeInTheDocument();
    expect(within(screen.getByText("João Pereira").closest("tr")!).getByText("Em dia")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Em atraso, 2" }));
    await waitFor(() => expect(calls.at(-1)!.get("financial")).toBe("OVERDUE"));
    expect(screen.getByRole("button", { name: "Em atraso, 2" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Em atraso, 2" }));
    await waitFor(() => expect(calls.at(-1)!.get("financial")).toBeNull());
  });

  it("CA29: filtros rápidos Ativos e Ex-alunos mostram a contagem do servidor, filtram e se desligam com o segundo clique", async () => {
    const user = userEvent.setup();
    setup();
    const active = await screen.findByRole("button", { name: "Ativos, 3" });
    const former = screen.getByRole("button", { name: "Ex-alunos, 1" });
    expect(active).toHaveAttribute("aria-pressed", "false");
    await user.click(active);
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBe("ACTIVE"));
    expect(screen.getByRole("button", { name: "Ativos, 3" })).toHaveAttribute("aria-pressed", "true");
    await user.click(former);
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBe("FORMER"));
    await user.click(screen.getByRole("button", { name: "Ex-alunos, 1" }));
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBeNull());
  });

  it("CA6 (#450): Exportar CSV e Bloqueados aparecem desabilitados com Em breve e o clique não gera requisição", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByRole("button", { name: "Ativos, 3" });
    const before = calls.length;
    for (const name of ["Exportar CSV", "Bloqueados"]) {
      const el = screen.getByRole("button", { name });
      expect(el).toHaveAttribute("aria-disabled", "true");
      expect(el).toHaveAccessibleDescription("Disponível em uma próxima versão");
      await user.click(el);
    }
    expect(screen.getAllByText("Em breve")).toHaveLength(2);
    expect(calls).toHaveLength(before);
  });

  it("CA9: vazio sem alunos; outro texto com Limpar filtros quando o filtro não acha ninguém", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0 }));
    expect(await screen.findByText("Nada por aqui ainda")).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "zzz");
    expect(await screen.findByText("Nenhum resultado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(await screen.findByText("Nada por aqui ainda")).toBeInTheDocument();
  });

  it("CA9: erro com Tentar de novo refaz a consulta", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup("COORDINATOR", () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ items: all, page: 1, size: 25, total: 2 })));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
  });

  it("CA9: sem permissão quando o servidor responde 403", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("canvasStates (#464): erro, vazio, 403 e carregando usam o cartão do canvas, com a busca acima; o 403 tem o cadeado em quadro", async () => {
    // Erro: cartão (section com título em caixa alta) e busca visível.
    const err = setup("COORDINATOR", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveClass("rounded-card");
    expect(within(alert).getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
    err.unmount();

    // Vazio.
    const empty = setup("COORDINATOR", () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0 }));
    expect((await screen.findByText("Nada por aqui ainda")).closest("section")).toHaveClass("rounded-card");
    empty.unmount();

    // Carregando: esqueleto da tabela (cabeçalho das colunas e 8 linhas) com role status.
    const loading = setup("COORDINATOR", () => new Promise<Response>(() => {}));
    await waitFor(() => expect(document.querySelectorAll("tbody tr")).toHaveLength(8));
    expect(screen.getAllByRole("status")).not.toHaveLength(0);
    expect(document.querySelector("thead")).toHaveTextContent("Graduação");
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toBeInTheDocument();
    loading.unmount();

    // Sem permissão: cadeado em quadro arredondado acima do título (M4).
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    const title = await screen.findByText("Você não tem acesso");
    const card = title.closest("section")!;
    expect(card).toHaveClass("rounded-card");
    const frame = within(card).getByTestId("state-icon-frame");
    expect(frame).toHaveClass("rounded-card");
    expect(frame.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("canvasStates (#464): a 360 px o estado de erro não tem violações no axe", async () => {
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }));
    await screen.findByRole("button", { name: "Tentar de novo" });
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA9: trocar de página refaz a consulta", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR", () => HttpResponse.json({ items: all, page: 1, size: 25, total: 60 }));
    await screen.findByText("Ana Souza");
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    await waitFor(() => expect(calls.at(-1)!.get("page")).toBe("2"));
  });

  it("CA8: Aluno é fixo; desligar Idade tira a coluna, a escolha volta ao reabrir com a mesma conta e não vale para outra", async () => {
    const user = userEvent.setup();
    const first = setup();
    await screen.findByText("Ana Souza");
    expect(screen.getByRole("columnheader", { name: "Idade" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Colunas" }));
    expect(screen.queryByRole("checkbox", { name: "Aluno" })).toBeNull();
    await user.click(screen.getByRole("checkbox", { name: "Idade" }));
    expect(screen.queryByRole("columnheader", { name: "Idade" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Aluno" })).toBeInTheDocument();
    first.unmount();

    setup();
    await screen.findByText("Ana Souza");
    expect(screen.queryByRole("columnheader", { name: "Idade" })).toBeNull();
    expect(screen.getByRole("columnheader", { name: "Unidade" })).toBeInTheDocument();
  });


  it("CA8: outra conta abre com todas as colunas", async () => {
    localStorage.setItem("ctcore.studentColumns.a", JSON.stringify(["unit"]));
    setup("COORDINATOR", undefined, "b");
    await screen.findByText("Ana Souza");
    for (const name of ["Modalidades e turmas", "Graduação", "Situação", "Financeiro", "Unidade", "Idade", "Faixa etária", "Cadastrado em"]) expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
  });

  it("CA8: sem armazenamento disponível a tela abre com todas as colunas e a escolha vale na página", async () => {
    const user = userEvent.setup();
    const get = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    setup();
    await screen.findByText("Ana Souza");
    expect(screen.getByRole("columnheader", { name: "Idade" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Colunas" }));
    await user.click(screen.getByRole("checkbox", { name: "Idade" }));
    expect(screen.queryByRole("columnheader", { name: "Idade" })).toBeNull();
    get.mockRestore();
    set.mockRestore();
  });

  it.each(["COORDINATOR", "ADMINISTRATOR"])("CA10: %s vê Alunos no menu e chega à tela", async (role) => {
    setup(role);
    await ready();
    const links = screen.getAllByRole("link", { name: "Alunos" });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/alunos");
  });

  it("CA10: Professor não vê o item no menu", async () => {
    setup("TEACHER");
    await waitFor(() => expect(screen.queryByText("Carregando...")).toBeNull());
    expect(screen.queryByRole("link", { name: "Alunos" })).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA9: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findByText("Ana Souza");
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Colunas" }));
    expect(await axeViolations(container)).toEqual([]);
  });

  it("D2: as abas são exclusivas e seguem a ordem do canvas", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByRole("button", { name: "Ativos, 3" });
    expect(screen.getAllByRole("button", { name: /^(Ativos|Em atraso|Bloqueados|Ex-alunos)/ }).map((b) => b.textContent)).toEqual(["Ativos 3", "Em atraso 2", "Bloqueados", "Ex-alunos 1"]);
    await user.click(screen.getByRole("button", { name: "Ativos, 3" }));
    await user.click(screen.getByRole("button", { name: "Em atraso, 2" }));
    await waitFor(() => expect(calls.at(-1)!.get("financial")).toBe("OVERDUE"));
    expect(calls.at(-1)!.get("status")).toBeNull();
  });

  it("#465 CA1: subtítulo com a contagem (carregando… antes da resposta), Exportar CSV em breve e Nova matrícula", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    setup("COORDINATOR", async () => {
      await gate;
      return HttpResponse.json({ items: all, page: 1, size: 25, total: 2, counts: { active: 3, former: 1, overdue: 2 } });
    });
    await ready();
    expect(screen.getByText(/carregando… · 1 ficha por pessoa na organização/)).toBeInTheDocument();
    release();
    expect(await screen.findByText(/· 3 ativos · 1 ficha por pessoa na organização/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar CSV" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "Nova matrícula" })).toHaveAttribute("href", "/alunos/nova-matricula");
    expect(screen.queryByText(/Alunos da organização, com a unidade/)).toBeNull();
  });

  it("#465 CA2: Colunas abre o popover, Esc fecha e devolve o foco ao botão", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("Ana Souza");
    const button = screen.getByRole("button", { name: "Colunas" });
    await user.click(button);
    expect(screen.getByRole("dialog", { name: "Colunas" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Colunas" })).toBeNull();
    expect(button).toHaveFocus();
  });

  it("#465 CA3: Graduação mostra traço, Situação e Financeiro têm selo com tom, modalidade tem ponto", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ items: [student({ status: "ACTIVE", financialStatus: "OVERDUE", modalities: [bjj] })], page: 1, size: 25, total: 1, counts: { active: 1, former: 0, overdue: 1 } }));
    const row = (await screen.findByText("Ana Souza")).closest("tr")!;
    expect(screen.getByRole("columnheader", { name: "Graduação" })).toBeInTheDocument();
    expect(within(row).getByText("Em atraso")).toHaveAttribute("data-tone", "danger");
    expect(within(row).getByText("Ativo")).toHaveAttribute("data-tone", "ok");
    expect(row.querySelector("[data-tone][class*=rounded-full][class*=size-2]")).not.toBeNull();
    expect(screen.getByRole("button", { name: /^Bloqueados/ })).toHaveAttribute("aria-disabled", "true");
  });

  it("#465 CA5: abaixo de 640 px há um cartão por aluno com a seta para a ficha, Nova matrícula ao lado de Filtros e sem Colunas", async () => {
    setDeviceNarrow(true);
    try {
      setup();
      await screen.findByText("Ana Souza");
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByRole("link", { name: "Abrir a ficha de Ana Souza" })).toHaveAttribute("href", "/alunos/s1");
      expect(screen.getAllByRole("link", { name: "Nova matrícula" })).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Filtros" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Colunas" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Exportar CSV" })).toBeNull();
    } finally {
      setDeviceNarrow(false);
    }
  });

  it("CA6/CA8: abaixo de 640 px os filtros abrem na folha com campos, Ver N alunos e Limpar filtros", async () => {
    setDeviceNarrow(true);
    try {
      const user = userEvent.setup();
      setup("COORDINATOR", undefined, "a", "/alunos?modalityId=m1&classId=k1");
      await screen.findByText("Ana Souza");
      expect(screen.queryByRole("button", { name: /^Modalidade/ })).toBeNull();
      await user.click(screen.getByRole("button", { name: "Filtros 2" }));
      const dialog = screen.getByRole("dialog", { name: "Filtros" });
      expect(within(dialog).getByRole("button", { name: "Ver 2 alunos" })).toBeInTheDocument();
      expect(within(dialog).getByRole("combobox", { name: "Nível" })).toBeEnabled();
      await user.selectOptions(within(dialog).getByRole("combobox", { name: "Modalidade" }), "m3");
      await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBe("m3"));
      await user.click(within(dialog).getByRole("button", { name: "Limpar filtros" }));
      await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBeNull());
      expect(within(dialog).getByRole("combobox", { name: "Nível" })).toBeDisabled();
    } finally {
      setDeviceNarrow(false);
    }
  });
});
