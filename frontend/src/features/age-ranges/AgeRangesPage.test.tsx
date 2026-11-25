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
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { AgeRange } from "./useAgeRanges";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const used = (count: number, ...names: string[]) => ({ count, names });
const defaults = (): AgeRange[] => [
  { id: "r1", name: "Infantil", minAge: 4, maxAge: 12, usedIn: used(2, "Turmas Kids", "Muay Thai Kids") },
  { id: "r2", name: "Juvenil", minAge: 13, maxAge: 17, usedIn: used(1, "Jiu-Jitsu Juvenil") },
  { id: "r3", name: "Adulto", minAge: 18, maxAge: null, usedIn: used(7, "A", "B") },
];
const LAST = { at: "2026-10-02T17:12:00Z", by: "Marcos Leão" };

let items: AgeRange[];
let writes: { method: string; body: unknown }[];

function setup(role: string, over: { list?: () => Response | Promise<Response>; initial?: AgeRange[]; last?: typeof LAST | null } = {}) {
  items = over.initial ?? defaults();
  writes = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: false, units: [] })),
    http.get("/api/v1/age-ranges", over.list ?? (() => HttpResponse.json({ canManage: role === "COORDINATOR", items, lastChange: over.last === undefined ? LAST : over.last }))),
    http.post("/api/v1/age-ranges", async ({ request }) => {
      const body = (await request.json()) as Omit<AgeRange, "id" | "usedIn">;
      writes.push({ method: "POST", body });
      if (body.name.toLowerCase() === "juvenil") return HttpResponse.json({ code: "AGE_RANGE_NAME_TAKEN", fields: [] }, { status: 409 });
      const created = { id: "novo", ...body, usedIn: used(0) };
      items = [...items, created];
      return HttpResponse.json(created, { status: 201 });
    }),
    http.put("/api/v1/age-ranges/:id", async ({ request, params }) => {
      const body = (await request.json()) as Omit<AgeRange, "id" | "usedIn">;
      writes.push({ method: "PUT", body });
      const updated = { id: params.id as string, ...body, usedIn: used(0) };
      items = items.map((r) => (r.id === params.id ? updated : r));
      return HttpResponse.json(updated);
    }),
    http.delete("/api/v1/age-ranges/:id", ({ params }) => {
      writes.push({ method: "DELETE", body: params.id });
      if (params.id === "r3") return HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 });
      items = items.filter((r) => r.id !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/configuracoes/faixas-etarias"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Faixas etárias", level: 1 });
const rows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1).map((tr) => within(tr).getAllByRole("cell").map((td) => td.textContent).join("|"));

describe("AgeRangesPage", () => {
  it("CA1, CA2: subtítulo, Nova faixa etária no cabeçalho, cinco cabeçalhos, traço sem máximo e Usada em (nenhuma, uma, duas e muitas turmas)", async () => {
    setup("COORDINATOR", { initial: [...defaults(), { id: "r4", name: "Master", minAge: 35, maxAge: null, usedIn: used(0) }] });
    await ready();
    expect(screen.queryByText(/^Administrativas: organizam turmas/)).toBeNull();
    expect(screen.getByRole("button", { name: "Nova faixa etária" })).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Nome", "Idade mínima", "Idade máxima", "Usada em", "Ações"]);
    expect(rows()).toEqual([
      "Infantil|4|12|Turmas Kids e Muay Thai Kids|",
      "Juvenil|13|17|Jiu-Jitsu Juvenil|",
      "Adulto|18|—|7 turmas|",
      "Master|35|—|Sem turmas|",
    ]);
    const pencil = screen.getByRole("button", { name: "Editar Infantil" });
    expect(pencil).toHaveAttribute("title", "Editar");
    expect(pencil).not.toHaveTextContent(/Editar|Apagar/);
    expect(screen.queryByRole("button", { name: /^Apagar/ })).toBeNull();
  });

  it("CA5: faixa azul das categorias de competição e última alteração; sem registro, Ainda sem alterações", async () => {
    const { unmount } = setup("COORDINATOR");
    await ready();
    expect(screen.getByText(/^Categorias de competição \(IBJJF, CBJ e outras\) não entram no cadastro/)).toBeInTheDocument();
    expect(screen.getByText(/^Última alteração em 02\/10\/2026 .* por Marcos Leão$/)).toBeInTheDocument();
    unmount();
    setup("COORDINATOR", { last: null });
    expect(await screen.findByText("Ainda sem alterações")).toBeInTheDocument();
  });

  it("CA7: a 390 px há cartões e nenhuma tabela; a partir de 640 px a tabela e nenhum cartão", async () => {
    setDeviceNarrow(true);
    const { unmount } = setup("COORDINATOR");
    await ready();
    expect(screen.queryByRole("table")).toBeNull();
    const card = screen.getByText("Infantil").closest("li")!;
    expect(within(card).getByText("4 a 12 anos")).toBeInTheDocument();
    expect(within(card).getByText("Turmas Kids e Muay Thai Kids")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Editar Infantil" })).toBeInTheDocument();
    unmount();
    setDeviceNarrow(false);
    setup("COORDINATOR");
    await ready();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem").filter((li) => li.textContent?.includes("4 a 12 anos"))).toHaveLength(0);
  });

  it("CA9: o Administrador vê a lista sem botões de escrita", async () => {
    setup("ADMINISTRATOR");
    await ready();
    expect(rows()).toHaveLength(3);
    expect(screen.queryByRole("button", { name: /Nova faixa|Editar|Apagar/ })).toBeNull();
    expect(within(screen.getByRole("table")).queryByRole("columnheader", { name: "Ações" })).toBeNull();
  });

  it("CA9: cria uma faixa sem máximo; a lista reflete sem recarregar; nome repetido mostra o erro no campo", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("button", { name: "Nova faixa etária" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(within(dialog).getAllByRole("alert").length).toBeGreaterThanOrEqual(2);
    expect(writes).toEqual([]);
    await user.type(within(dialog).getByLabelText("Nome da faixa"), "Juvenil");
    await user.type(within(dialog).getByLabelText("Idade mínima"), "13");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await within(dialog).findByText("Já existe uma faixa com este nome.")).toBeInTheDocument();
    const name = within(dialog).getByLabelText("Nome da faixa");
    await user.clear(name);
    await user.type(name, "Master");
    await user.clear(within(dialog).getByLabelText("Idade mínima"));
    await user.type(within(dialog).getByLabelText("Idade mínima"), "35");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(writes.at(-1)).toEqual({ method: "POST", body: { name: "Master", minAge: 35, maxAge: null } });
    expect(rows().at(-1)).toBe("Master|35|—|Sem turmas|");
    expect(screen.getByText("Faixa etária salva")).toBeInTheDocument();
  });

  it("CA9: máxima menor que a mínima mostra o erro no campo sem enviar", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("button", { name: "Nova faixa etária" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Nome da faixa"), "Teste");
    await user.type(within(dialog).getByLabelText("Idade mínima"), "20");
    await user.type(within(dialog).getByLabelText("Idade máxima (opcional)"), "10");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("da mínima até 120");
    expect(writes).toEqual([]);
  });

  it("CA9: edita nome e idades e a lista passa a mostrar os novos valores", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("button", { name: "Editar Juvenil" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar faixa etária" });
    expect(within(dialog).getByLabelText("Idade máxima (opcional)")).toHaveValue("17");
    const name = within(dialog).getByLabelText("Nome da faixa");
    await user.clear(name);
    await user.type(name, "Teen");
    await user.clear(within(dialog).getByLabelText("Idade máxima (opcional)"));
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(writes.at(-1)).toEqual({ method: "PUT", body: { name: "Teen", minAge: 13, maxAge: null } });
    expect(rows()[1]).toBe("Teen|13|—|Sem turmas|");
  });

  it("CA3: Apagar fica no rodapé da janela de edição, pede confirmação, remove da lista; cancelar não apaga; falha avisa e mantém a faixa", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("button", { name: "Editar Juvenil" }));
    const edit = await screen.findByRole("dialog", { name: "Editar faixa etária" });
    expect(within(edit).getByLabelText("Nome da faixa")).toHaveValue("Juvenil");
    await user.click(within(edit).getByRole("button", { name: "Apagar" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar" }));
    expect(writes).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Editar Juvenil" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Apagar" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Apagar" }));
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(screen.getByText("Faixa Juvenil apagada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Editar Adulto" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Apagar" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Apagar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível apagar Adulto");
    expect(rows()).toHaveLength(2);
  });

  it("CA3: a janela de nova faixa não tem Apagar", async () => {
    const user = userEvent.setup();
    setup("COORDINATOR");
    await ready();
    await user.click(screen.getByRole("button", { name: "Nova faixa etária" }));
    expect(within(await screen.findByRole("dialog")).queryByRole("button", { name: "Apagar" })).toBeNull();
  });

  it("CA9: lista vazia mostra o estado vazio com botão de criar para quem pode, e sem ele para o Administrador", async () => {
    setup("COORDINATOR", { initial: [] });
    expect(await screen.findByRole("heading", { name: "Nenhuma faixa etária" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova faixa etária" })).toBeInTheDocument();
  });

  it("CA9: vazio para o Administrador não tem botão de criar", async () => {
    setup("ADMINISTRATOR", { initial: [] });
    expect(await screen.findByRole("heading", { name: "Nenhuma faixa etária" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nova faixa etária" })).toBeNull();
  });

  it("CA9: carregando, erro com nova tentativa e sem permissão", async () => {
    const user = userEvent.setup();
    let calls = 0;
    setup("COORDINATOR", {
      list: () => (++calls === 1 ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json({ canManage: true, items: defaults(), lastChange: null })),
    });
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    await user.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    await ready();
  });

  it("CA9: o 403 do servidor mostra o estado sem permissão", async () => {
    setup("COORDINATOR", { list: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByRole("heading", { name: "Você não tem acesso" })).toBeInTheDocument();
  });

  it("CA10: o item aparece no menu de Configurações para Coordenador e Administrador e não para Professor", async () => {
    for (const [role, visible] of [["COORDINATOR", true], ["ADMINISTRATOR", true], ["TEACHER", false]] as const) {
      const { unmount } = setup(role);
      if (visible) {
        await ready();
        expect(screen.getAllByRole("link", { name: "Faixas etárias" })[0]).toHaveAttribute("href", "/configuracoes/faixas-etarias");
      } else {
        await screen.findByRole("heading", { level: 1 });
        expect(screen.queryByRole("link", { name: "Faixas etárias" })).toBeNull();
      }
      unmount();
    }
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA9: a 360 px não tem violações no axe no tema %s, com a lista e com a janela aberta", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup("COORDINATOR");
    await ready();
    expect(await axeViolations(container)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Nova faixa etária" }));
    await screen.findByRole("dialog");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
