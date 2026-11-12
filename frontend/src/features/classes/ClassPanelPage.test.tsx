import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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
import type { ClassDetail } from "./useClasses";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const detail = (over: Partial<ClassDetail> = {}): ClassDetail => ({
  id: "c1",
  name: "Jiu-Jitsu Adulto",
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  ageRange: { id: "r1", name: "Adulto", minAge: 18, maxAge: null },
  schedule: [
    { weekday: 1, startsAt: "19:00", endsAt: "20:00" },
    { weekday: 3, startsAt: "19:00", endsAt: "20:00" },
  ],
  head: { id: "t1", name: "Rafael Duarte" },
  assistants: [{ id: "t2", name: "Thiago Moreira" }],
  activeStudents: 0,
  capacity: 30,
  overCapacity: false,
  status: "ACTIVE",
  groupLink: "https://chat.example.com/invite/AbCdLp2A",
  nextClass: null,
  lastChange: null,
  students: [],
  deactivation: { allowed: true, blockingStudents: 0, blockingList: [] },
  ...over,
});

let deactivated: number;

function setup(get: () => Response | Promise<Response> = () => HttpResponse.json(detail()), role = "COORDINATOR") {
  deactivated = 0;
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }] })),
    http.get("/api/v1/classes/c1", () => get()),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/turmas/c1"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Jiu-Jitsu Adulto" });

// As permissões chegam depois do painel.
const enabled = () => waitFor(() => expect(screen.getByRole("button", { name: "Desativar" })).toBeEnabled());

describe("ClassPanelPage (RF-TUR-02)", () => {
  it("CA6: a gaveta mostra selos, cabeçalho de três partes, professores, capacidade, grupo encurtado e vazios", async () => {
    setup();
    await ready();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Jiu-Jitsu")).toBeInTheDocument();
    expect(within(dialog).queryByText(/Acima da capacidade/)).toBeNull();
    expect(within(dialog).getByText("Tijuca · Adulto · Seg e Qua · 19h–20h")).toBeInTheDocument();
    expect(within(dialog).getByText("Rafael Duarte (titular) · Thiago Moreira (auxiliar)")).toBeInTheDocument();
    expect(within(dialog).getByText("30 · só avisa")).toBeInTheDocument();
    expect(within(dialog).getByText("chat.example.com/…Lp2A")).toBeInTheDocument();
    expect(within(dialog).getByText("Sem próxima aula")).toBeInTheDocument();
    expect(within(dialog).getByText("Nenhum aluno ativo nesta turma.")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Próxima aula", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Abrir grupo" })).toHaveAttribute("href", "https://chat.example.com/invite/AbCdLp2A");
    expect(screen.getByRole("link", { name: "Abrir grupo" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Abrir grupo" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  });

  it("CA8: Ver alunos é link para a lista filtrada, também em turma desativada; Editar e Desativar estão ativos (CA13)", async () => {
    setup();
    await ready();
    expect(screen.getByRole("link", { name: "Ver todos os alunos" })).toHaveAttribute("href", "/alunos?classId=c1");
    await enabled();
    cleanup();
    setup(() => HttpResponse.json(detail({ status: "INACTIVE" })));
    await ready();
    expect(screen.getByRole("link", { name: "Ver todos os alunos" })).toHaveAttribute("href", "/alunos?classId=c1");
  });

  it("CA26 (#82): Avisar turma abre o comunicado já com a turma; sem a permissão ou com a turma desativada fica desativado", async () => {
    setup();
    await ready();
    expect(await screen.findByRole("link", { name: "Avisar turma" })).toHaveAttribute("href", "/comunicados/novo?classId=c1");
    cleanup();
    setup(() => HttpResponse.json(detail({ status: "INACTIVE" })));
    await ready();
    await enabled().catch(() => undefined);
    expect(screen.getByRole("button", { name: "Avisar turma" })).toBeDisabled();
  });

  it("CA7: sem a permissão de comunicados Avisar turma fica desativado; sem CLASSES_MANAGE, Editar e Desativar também", async () => {
    setup();
    server.use(http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: { ...mockPermissions("COORDINATOR"), ANNOUNCEMENTS: "NONE", CLASSES_MANAGE: "NONE" } })));
    await ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Avisar turma" })).toBeDisabled());
    expect(screen.getByRole("button", { name: "Editar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Desativar" })).toBeDisabled();
  });

  it.each([[null], ["javascript:alert(1)"], ["data:text/html,x"], ["nao e url"]])("CA6: link de grupo %s não vira botão e mostra Sem grupo", async (link) => {
    setup(() => HttpResponse.json(detail({ groupLink: link })));
    await ready();
    expect(screen.queryByRole("link", { name: "Abrir grupo" })).toBeNull();
    expect(screen.getByRole("button", { name: "Abrir grupo" })).toBeDisabled();
    expect(screen.getByText("Sem grupo")).toBeInTheDocument();
  });

  it("CA6: capacidade excedida vira selo âmbar ao lado do nome; sem capacidade diz Sem limite", async () => {
    const { unmount } = setup(() => HttpResponse.json(detail({ activeStudents: 31, overCapacity: true })));
    await ready();
    expect(screen.getByText("Acima da capacidade (31/30)")).toHaveAttribute("data-tone", "warn");
    unmount();
    setup(() => HttpResponse.json(detail({ activeStudents: 4, capacity: null })));
    await ready();
    expect(screen.getByText("Sem limite")).toBeInTheDocument();
  });

  it("CA6, CA8: próxima aula com professor, resumo, avatar, papel e faixa com graus; sem graduação só nome e papel; até 10 alunos", async () => {
    const day = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    };
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `x${i}`, name: `Aluno ${String.fromCharCode(65 + i)}`, primary: true, belt: null, beltColor: null, beltSecondaryColor: null, degree: 0 }));
    setup(() =>
      HttpResponse.json(
        detail({
          activeStudents: 14,
          nextClass: { date: day(0), startsAt: "19:30", endsAt: "21:00", teacher: { id: "t1", name: "Rafael Duarte" } },
          students: [
            { id: "s1", name: "Bia Lima", primary: true, belt: "Azul", beltColor: "#1D4ED8", beltSecondaryColor: null, degree: 2 },
            { id: "s2", name: "Caio Reis", primary: false, belt: null, beltColor: null, beltSecondaryColor: null, degree: 0 },
            ...many.slice(0, 10),
          ],
        }),
      ),
    );
    await ready();
    expect(screen.getByText("Hoje, 19h30 · Rafael Duarte")).toBeInTheDocument();
    expect(screen.getByText("11 na turma principal · 1 como outro horário")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    const bia = items.find((li) => /Bia Lima/.test(li.textContent ?? ""))!;
    expect(within(bia).getByText("BL")).toBeInTheDocument();
    expect(within(bia).getByText("Turma principal")).toBeInTheDocument();
    expect(within(bia).getByText("Faixa Azul · 2 graus")).toBeInTheDocument();
    const caio = items.find((li) => /Caio Reis/.test(li.textContent ?? ""))!;
    expect(within(caio).getByText("Outro horário")).toBeInTheDocument();
    expect(within(caio).queryByRole("img")).toBeNull();
    expect(screen.queryByText("Aluno J")).toBeNull();
    expect(screen.getByText("Aluno H")).toBeInTheDocument();
    expect(screen.queryByText("Aluno I")).toBeNull();
  });

  it.each([
    [1, "Amanhã, 19h30 · Rafael Duarte"],
    [5, /^\d{2}\/\d{2}, 19h30 · Rafael Duarte$/],
  ])("CA6: próxima aula daqui a %i dia(s)", async (offset, expected) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const date = d.toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    setup(() => HttpResponse.json(detail({ nextClass: { date, startsAt: "19:30", endsAt: "21:00", teacher: { id: "t1", name: "Rafael Duarte" } } })));
    await ready();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("CA8: turma desativada tem selo e Desativar desativado", async () => {
    setup(() => HttpResponse.json(detail({ status: "INACTIVE", deactivation: { allowed: false, blockingStudents: 0, blockingList: [] } })));
    await ready();
    expect(within(screen.getAllByRole("dialog")[0]).getByText("Desativada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativar" })).toBeDisabled();
  });

  it("CA9: sem alunos principais confirmar desativa e o painel passa a Desativada", async () => {
    const user = userEvent.setup();
    let current = detail();
    setup(() => HttpResponse.json(current));
    server.use(
      http.post("/api/v1/classes/c1/deactivate", () => {
        deactivated += 1;
        current = detail({ status: "INACTIVE", deactivation: { allowed: false, blockingStudents: 0, blockingList: [] } });
        return HttpResponse.json(current);
      }),
    );
    await ready();
    await enabled();
    await user.click(screen.getByRole("button", { name: "Desativar" }));
    const dialog = await screen.findByRole("dialog", { name: "Desativar turma" });
    await user.click(within(dialog).getByRole("button", { name: "Desativar turma" }));
    await waitFor(() => expect(deactivated).toBe(1));
    expect(await screen.findByText("Turma desativada.")).toBeInTheDocument();
    expect(within(screen.getAllByRole("dialog")[0]).getByText("Desativada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Desativar" })).toBeDisabled();
  });

  it("CA8: carregando, erro com Tentar de novo, sem permissão e turma não encontrada", async () => {
    const user = userEvent.setup();
    let fail = true;
    const first = setup(() => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(detail())));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    await ready();
    first.unmount();
    const second = setup(() => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    second.unmount();
    setup(() => HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 }));
    expect(await screen.findByText("Turma não encontrada")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA8: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await ready();
    expect(await axeViolations(container)).toEqual([]);
  });
});
