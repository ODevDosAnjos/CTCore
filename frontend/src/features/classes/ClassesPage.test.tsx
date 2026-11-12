import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { expectPillOptions, pickPill } from "@/test/pill";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { TrainingClass } from "./useClasses";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const klass = (over: Partial<TrainingClass>): TrainingClass => ({
  id: "c1",
  name: "Jiu-Jitsu Adulto · Noite",
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  ageRange: { id: "a1", name: "Adulto", minAge: 18, maxAge: null },
  schedule: [
    { weekday: 1, startsAt: "19:30", endsAt: "21:00" },
    { weekday: 3, startsAt: "19:30", endsAt: "21:00" },
    { weekday: 5, startsAt: "19:30", endsAt: "21:00" },
  ],
  head: { id: "t1", name: "Rafael Duarte" },
  assistants: [{ id: "t2", name: "Thiago Moreira" }],
  activeStudents: 31,
  capacity: 30,
  overCapacity: true,
  status: "ACTIVE",
  ...over,
});
const all = [
  klass({}),
  klass({ id: "c2", name: "No-Gi Adulto", modality: { id: "m2", name: "No-Gi" }, ageRange: null, assistants: [], capacity: null, activeStudents: 14, overCapacity: false, schedule: [{ weekday: 6, startsAt: "10:00", endsAt: "11:30" }] }),
  klass({
    id: "c3",
    name: "Boxe Antigo",
    status: "INACTIVE",
    modality: { id: "m3", name: "Boxe" },
    assistants: [],
    activeStudents: 3,
    capacity: 20,
    overCapacity: false,
    schedule: [
      { weekday: 2, startsAt: "07:00", endsAt: "08:30" },
      { weekday: 4, startsAt: "17:00", endsAt: "18:00" },
    ],
  }),
];

let calls: URLSearchParams[];

function setup(role = "COORDINATOR", list?: () => Response | Promise<Response>, units = [{ id: "u1", name: "Tijuca", shortName: "t" }]) {
  calls = [];
  window.history.replaceState(null, "", "/turmas");
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: units.length > 1, units })),
    http.get("/api/v1/modalities", () =>
      HttpResponse.json([
        { id: "m1", name: "Jiu-Jitsu", active: true, canManage: false, graduationEnabled: true },
        { id: "m3", name: "Karatê", active: false, canManage: false, graduationEnabled: false },
      ]),
    ),
    http.get("/api/v1/teachers", () => HttpResponse.json({ items: [{ id: "t1", name: "Rafael Duarte" }], page: 1, size: 100, total: 1 })),
    http.get("/api/v1/age-ranges", () => HttpResponse.json({ canManage: false, items: [{ id: "a1", name: "Adulto", minAge: 18, maxAge: null }] })),
    http.get("/api/v1/classes", ({ request }) => {
      const p = new URL(request.url).searchParams;
      calls.push(p);
      if (list) return list();
      const q = (p.get("q") ?? "").toLowerCase();
      const items = all.filter((c) => c.name.toLowerCase().includes(q) && (!p.get("status") || c.status === p.get("status")));
      return HttpResponse.json({ items, page: 1, size: 25, total: items.length, counts: { active: 5, inactive: 1 } });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/turmas"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Turmas", level: 1 });

describe("ClassesPage", () => {
  it("CA1: subtítulo com a unidade e a contagem (carregando… antes), Nova turma com ícone, sem introdução e sem filtro de unidade", async () => {
    setup();
    expect(await screen.findByText(/carregando…/)).toBeInTheDocument();
    expect(await screen.findByText("Unidade Tijuca · 5 ativas · a turma não guarda presença")).toBeInTheDocument();
    const novo = screen.getByRole("button", { name: "Nova turma" });
    expect(novo.querySelector("svg")).not.toBeNull();
    expect(screen.queryByText(/Turmas das suas unidades/)).toBeNull();
    expect(within(screen.getByRole("search")).queryByRole("button", { name: /^Unidade/ })).toBeNull();
    await waitFor(() => expect(calls.at(-1)!.get("unitId")).toBe("u1"));
  });

  it('CA1: com o escopo "todas" o subtítulo diz Todas as unidades e a lista não filtra por unidade', async () => {
    setup("COORDINATOR", undefined, [
      { id: "u1", name: "Tijuca", shortName: "t" },
      { id: "u2", name: "Barra", shortName: "b" },
    ]);
    expect(await screen.findByText("Todas as unidades · 5 ativas · a turma não guarda presença")).toBeInTheDocument();
    expect(calls.at(-1)!.has("unitId")).toBe(false);
  });

  it("CA3: nome em negrito sem sublinhado nem Unidade:, ponto da modalidade, dias, professor com auxiliar, 31 / 30 e selo âmbar na mesma linha; a linha abre o painel", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    const link = await screen.findByRole("link", { name: "Jiu-Jitsu Adulto · Noite" });
    expect(link).toHaveClass("font-bold");
    expect(link).not.toHaveClass("underline");
    const row = link.closest("tr")!;
    expect(within(row).queryByText(/Unidade:/)).toBeNull();
    expect(row.querySelector("[data-tone].size-2")).not.toBeNull();
    expect(within(row).getByText("Adulto")).toBeInTheDocument();
    expect(within(row).getByText("Seg, Qua e Sex · 19h30–21h")).toBeInTheDocument();
    expect(within(row).getByText("Rafael Duarte")).toBeInTheDocument();
    expect(within(row).getByText("aux. Thiago Moreira")).toBeInTheDocument();
    expect(within(row).getByText(/^31 \/ 30/)).toBeInTheDocument();
    expect(within(row).getByText("Acima da capacidade (31/30)")).toHaveAttribute("data-tone", "warn");
    expect(within(row).getByText("Ativa")).toBeInTheDocument();
    const free = screen.getByText("No-Gi Adulto").closest("tr")!;
    expect(within(free).getByText("14 · sem limite")).toBeInTheDocument();
    expect(within(free).getByText("—")).toBeInTheDocument();
    expect(within(free).getByText("Sáb · 10h–11h30")).toBeInTheDocument();
    expect(within(free).queryByText(/Acima/)).toBeNull();
    expect(screen.getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Turma", "Modalidade", "Faixa etária", "Dias e horários", "Professor", "Alunos ativos", "Situação"]);
    expect(calls.at(-1)!.get("page")).toBe("1");
    expect(calls.at(-1)!.get("size")).toBe("25");
    server.use(http.get("/api/v1/classes/c1", () => HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 })));
    await user.click(within(row).getByText("Adulto"));
    expect(await screen.findByText("Turma não encontrada")).toBeInTheDocument();
  });

  it("CA3, CA4: a desativada fica esmaecida com o selo Desativada; horários diferentes entre dias viram trechos", async () => {
    setup();
    const old = (await screen.findByText("Boxe Antigo")).closest("tr")!;
    expect(old).toHaveClass("opacity-60");
    expect(within(old).getByText("Desativada")).toBeInTheDocument();
    expect(within(old).getByText("Ter · 7h–8h30 · Qui · 17h–18h")).toBeInTheDocument();
  });

  it("CA2: Situação abre em Ativas e desativadas; escolher Desativadas mostra só a desativada; filtros combinam e ficam no endereço", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("No-Gi Adulto");
    expect(screen.getByRole("button", { name: "Situação Ativas e desativadas" })).toBeInTheDocument();
    expect(calls[0].has("status")).toBe(false);
    await pickPill(user, "Situação", "Desativadas");
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBe("INACTIVE"));
    expect(await screen.findByText("Boxe Antigo")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("No-Gi Adulto")).toBeNull());
    await pickPill(user, "Professor", "Rafael Duarte");
    await waitFor(() => expect(calls.at(-1)!.get("teacherId")).toBe("t1"));
    expect(calls.at(-1)!.get("status")).toBe("INACTIVE");
    expect(window.location.search).toContain("status=INACTIVE");
    expect(window.location.search).toContain("teacherId=t1");
  });

  it("CA2: busca com placeholder Nome da turma; modalidades só ativas; modalidade, faixa e dia refazem a consulta", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("No-Gi Adulto");
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveAttribute("placeholder", "Nome da turma");
    await expectPillOptions(user, "Modalidade", ["Todas", "Jiu-Jitsu"]);
    await user.click(screen.getByRole("option", { name: "Jiu-Jitsu" }));
    await waitFor(() => expect(calls.at(-1)!.get("modalityId")).toBe("m1"));
    await pickPill(user, "Faixa etária", "Adulto");
    await waitFor(() => expect(calls.at(-1)!.get("ageRangeId")).toBe("a1"));
    await pickPill(user, "Dia", "Quarta-feira");
    await waitFor(() => expect(calls.at(-1)!.get("weekday")).toBe("3"));
    await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "box");
    await waitFor(() => expect(calls.at(-1)!.get("q")).toBe("box"));
    expect(calls.at(-1)!.get("modalityId")).toBe("m1");
  });

  it("ordenar pelo nome pede sort=name; filtro sem resultado mostra Limpar filtros", async () => {
    const user = userEvent.setup();
    setup();
    await screen.findByText("No-Gi Adulto");
    await user.click(screen.getByRole("button", { name: "Ordenar por Turma" }));
    await waitFor(() => expect(calls.at(-1)!.get("sort")).toBe("name,asc"));
    await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "zzz");
    expect(await screen.findByText("Nenhum resultado")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(await screen.findByText("No-Gi Adulto")).toBeInTheDocument();
  });

  it("CA13: vazio sem turmas", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0, counts: { active: 0, inactive: 0 } }));
    expect(await screen.findByText("Nada por aqui ainda")).toBeInTheDocument();
  });

  it("CA13: erro com Tentar de novo refaz a consulta", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup("COORDINATOR", () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ items: all, page: 1, size: 25, total: 3, counts: { active: 5, inactive: 1 } })));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("No-Gi Adulto")).toBeInTheDocument();
  });

  it("CA13: sem permissão quando o servidor responde 403", async () => {
    setup("COORDINATOR", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each(["COORDINATOR", "ADMINISTRATOR"])("%s vê Turmas em Operação e chega à tela", async (role) => {
    setup(role);
    await ready();
    const links = screen.getAllByRole("link", { name: "Turmas" });
    expect(links[0]).toHaveAttribute("href", "/turmas");
  });

  it("Professor não vê o item no menu", async () => {
    setup("TEACHER");
    await waitFor(() => expect(screen.queryByText("Carregando...")).toBeNull());
    expect(screen.queryByRole("link", { name: "Turmas" })).toBeNull();
  });

  it("RN-TUR-06: o arquivo de tradução da tela não fala de presença nem frequência, fora a frase do subtítulo do canvas", () => {
    const text = JSON.stringify(JSON.parse(readFileSync(join(process.cwd(), "src/i18n/pt-BR.json"), "utf8")).classes).replaceAll("a turma não guarda presença", "");
    expect(text).not.toMatch(/presen|frequên|frequen/i);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findByText("No-Gi Adulto");
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("ClassesPage · celular", () => {
  afterEach(() => setDeviceNarrow(false));

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: os cartões a 360 px não têm violações no axe no tema %s", async (_n, dark) => {
    setDeviceNarrow(true, dark);
    window.innerWidth = 360;
    const { container } = setup();
    await screen.findByText("No-Gi Adulto");
    expect(container.querySelector("table")).toBeNull();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA5: a 390 px cada turma é um cartão com modalidade, dias · professor e ocupação; abas com contagem, pílulas de modalidade e Nova turma ao pé", async () => {
    const user = userEvent.setup();
    setDeviceNarrow(true);
    setup();
    await ready();
    const card = (await screen.findByText("Jiu-Jitsu Adulto · Noite")).closest("li")!;
    expect(screen.queryByRole("table")).toBeNull();
    expect(within(card).getByText("Jiu-Jitsu")).toBeInTheDocument();
    expect(within(card).getByText("Seg, Qua e Sex · 19h30–21h · Rafael Duarte")).toBeInTheDocument();
    expect(within(card).getByText(/^31\/30/)).toBeInTheDocument();
    expect(within(card).getByText("Acima da capacidade (31/30)")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: "Ver Jiu-Jitsu Adulto · Noite" }).getAttribute("href")).toBe("/turmas/c1");
    const free = screen.getByText("No-Gi Adulto").closest("li")!;
    expect(within(free).getByText("14/—")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ativas, 5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativadas, 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jiu-Jitsu" })).toBeInTheDocument();
    const buttons = screen.getAllByRole("button", { name: "Nova turma" });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveClass("w-full");
    await user.click(screen.getByRole("button", { name: "Desativadas, 1" }));
    await waitFor(() => expect(calls.at(-1)!.get("status")).toBe("INACTIVE"));
  });
});
