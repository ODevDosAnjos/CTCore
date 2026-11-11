import { render, screen, waitFor, within } from "@testing-library/react";
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
import type { TeacherDetail } from "./useTeachers";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const detail = (over: Partial<TeacherDetail> = {}): TeacherDetail => ({
  id: "t1",
  name: "Ana Souza",
  photoUrl: null,
  bio: "Faixa preta.",
  email: "ana@alfa.test",
  phone: "(11) 91234-5678",
  directoryConsent: true,
  consentDeclaredByManagement: true,
  status: "ACTIVE",
  modalities: [{ id: "m1", name: "Jiu-Jitsu", levelId: "l1", level: "Roxa", degree: 2, levelColor: "#7E22CE", levelSecondaryColor: null }],
  units: [{ id: "u1", name: "Centro" }, { id: "u2", name: "Norte" }],
  classes: [],
  upcomingClasses: [],
  substitutions: [],
  lastAccessAt: null,
  access: "NONE",
  ...over,
});

let granted: unknown;
let resent: number;

function setup(get: () => Response | Promise<Response> = () => HttpResponse.json(detail()), role = "COORDINATOR") {
  granted = undefined;
  resent = 0;
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }, { id: "u2", name: "Norte", shortName: "n" }] })),
    http.get("/api/v1/teachers/t1", () => get()),
    http.post("/api/v1/teachers/t1/access", async ({ request }) => {
      granted = await request.json();
      return HttpResponse.json(detail({ access: "PENDING" }));
    }),
    http.post("/api/v1/teachers/t1/access/resend", () => {
      resent += 1;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/professores/t1"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Ana Souza", level: 2 });

describe("TeacherPanelPage (RF-PRO-02)", () => {
  it("CA9: mostra cabeçalho, apresentação, contato, graduação, unidades, vazios de turmas e aulas e a situação do acesso", async () => {
    setup();
    await ready();
    expect(screen.getByText("No diretório")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Faixa preta.")).toBeInTheDocument();
    expect(screen.getByText("ana@alfa.test")).toBeInTheDocument();
    expect(screen.getByText("(11) 91234-5678")).toBeInTheDocument();
    expect(screen.getByText("Faixa Roxa · 2 graus")).toBeInTheDocument();
    expect(screen.getByText(/Professor · Centro, Norte · sem acesso/)).toBeInTheDocument();
    expect(screen.getByText("Nenhuma turma ainda.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma aula agendada.")).toBeInTheDocument();
    
  });

  it("CA9: Editar e Inativar ativos; foto aparece quando há URL; WhatsApp só com telefone", async () => {
    setup(() => HttpResponse.json(detail({ photoUrl: "https://files.example/f.png" })));
    await ready();
    expect(await screen.findByRole("button", { name: "Editar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Inativar" })).toBeEnabled();
    expect(document.querySelector("img[src='https://files.example/f.png']")).not.toBeNull();
    expect(screen.queryByText("AS")).toBeNull();
    expect(screen.getByRole("link", { name: "Abrir conversa no WhatsApp" })).toHaveAttribute("href", expect.stringContaining("https://wa.me/55"));
  });

  it("CA9: sem telefone não há WhatsApp; turmas e próximas aulas listam o que vier", async () => {
    setup(() => HttpResponse.json(detail({ phone: null, classes: [{ id: "c1", name: "Jiu-Jitsu Noite", role: "HEAD", modalityId: "m1", unitName: "Centro", schedule: [] }], upcomingClasses: [{ classId: "c1", name: "Jiu-Jitsu Noite", startsAt: "2026-10-20T22:00:00Z" }] })));
    await ready();
    expect(screen.queryByRole("link", { name: "Abrir conversa no WhatsApp" })).toBeNull();
    expect(screen.getByText("Jiu-Jitsu Noite")).toBeInTheDocument();
    expect(screen.getAllByText(/Jiu-Jitsu Noite/).length).toBeGreaterThanOrEqual(2);
  });

  it("CA4: turmas com papel e horários, substituição futura, próximas aulas e linha do diretório", async () => {
    setup(() =>
      HttpResponse.json(
        detail({
          directoryConsent: false,
          classes: [{ id: "c1", name: "Jiu-Jitsu Adulto · Noite", role: "HEAD", modalityId: "m1", unitName: "Centro", schedule: [{ weekday: 1, startsAt: "19:30", endsAt: "21:00" }, { weekday: 3, startsAt: "19:30", endsAt: "21:00" }, { weekday: 5, startsAt: "19:30", endsAt: "21:00" }] }],
          substitutions: [{ classId: "c2", name: "Jiu-Jitsu Adulto · Manhã", startsAt: "2026-10-09T10:00:00Z" }],
        }),
      ),
    );
    await ready();
    expect(screen.getByText("Seg, Qua e Sex 19h30")).toBeInTheDocument();
    expect(screen.getByText("Substituto")).toBeInTheDocument();
    expect(screen.getByText("Substituição")).toBeInTheDocument();
    expect(screen.getByText("Não aparece no diretório")).toBeInTheDocument();
    expect(screen.queryByText("No diretório")).toBeNull();
  });

  it.each([
    ["NONE", "Dar acesso", true],
    ["ENDED", "Dar acesso", true],
    ["PENDING", "Reenviar convite", true],
    ["ACTIVE", "", false],
  ] as const)("CA9: com acesso %s mostra a ação certa", async (access, label, shows) => {
    setup(() => HttpResponse.json(detail({ access })));
    await ready();
    if (shows) expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    else {
      expect(screen.queryByRole("button", { name: "Dar acesso" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Reenviar convite" })).toBeNull();
    }
    if (access === "PENDING") expect(screen.queryByRole("button", { name: "Dar acesso" })).toBeNull();
    if (access === "NONE") expect(screen.queryByRole("button", { name: "Reenviar convite" })).toBeNull();
  });

  it("CA11: Dar acesso abre a janela com as unidades marcadas, envia e passa a mostrar Convite enviado", async () => {
    const user = userEvent.setup();
    let current = detail();
    setup(() => HttpResponse.json(current));
    server.use(
      http.post("/api/v1/teachers/t1/access", async ({ request }) => {
        granted = await request.json();
        current = detail({ access: "PENDING" });
        return HttpResponse.json(current);
      }),
    );
    await ready();
    await user.click(screen.getByRole("button", { name: "Dar acesso" }));
    const dialog = await screen.findByRole("dialog", { name: "Dar acesso a Ana Souza" });
    expect(within(dialog).getByRole("checkbox", { name: "Centro" })).toBeChecked();
    await user.click(within(dialog).getByRole("checkbox", { name: "Norte" }));
    await user.click(within(dialog).getByRole("button", { name: "Enviar convite" }));
    await waitFor(() => expect(granted).toEqual({ unitIds: ["u1"] }));
    expect(await screen.findByText(/convite enviado/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar convite" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dar acesso" })).toBeNull();
  });

  it("CA11: sem unidade marcada a janela avisa e não envia; erro 409 do servidor aparece na janela", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.post("/api/v1/teachers/t1/access", () => HttpResponse.json({ code: "ALREADY_LINKED" }, { status: 409 })));
    await ready();
    await user.click(screen.getByRole("button", { name: "Dar acesso" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("checkbox", { name: "Centro" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Norte" }));
    await user.click(within(dialog).getByRole("button", { name: "Enviar convite" }));
    expect(await within(dialog).findByText("Escolha ao menos uma unidade.")).toBeInTheDocument();
    expect(granted).toBeUndefined();
    await user.click(within(dialog).getByRole("checkbox", { name: "Centro" }));
    await user.click(within(dialog).getByRole("button", { name: "Enviar convite" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("já está ligado a outro cadastro");
  });

  it("CA9: Reenviar convite chama a rota e avisa; falha também avisa", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json(detail({ access: "PENDING" })));
    await ready();
    await user.click(screen.getByRole("button", { name: "Reenviar convite" }));
    expect(await screen.findByText("Convite reenviado.")).toBeInTheDocument();
    expect(resent).toBe(1);
    server.use(http.post("/api/v1/teachers/t1/access/resend", () => HttpResponse.json({ code: "TOO_MANY_REQUESTS" }, { status: 429 })));
    await user.click(screen.getByRole("button", { name: "Reenviar convite" }));
    expect(await screen.findByText(/Não foi possível reenviar/)).toBeInTheDocument();
  });

  it("CA9: carregando, erro com Tentar de novo, sem permissão e professor não encontrado", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup(() => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(detail())));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    await ready();
  });

  it("CA9: 403 vira sem permissão e 404 vira não encontrado", async () => {
    const { unmount } = setup(() => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    unmount();
    setup(() => HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 }));
    expect(await screen.findByText("Professor não encontrado")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar aos professores" })).toHaveAttribute("href", "/professores");
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA9: a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = setup();
    await ready();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("CA9: professor inativo não tem o botão Inativar ativo", async () => {
    setup(() => HttpResponse.json(detail({ status: "INACTIVE" })));
    await ready();
    expect(screen.getByRole("button", { name: "Inativar" })).toBeDisabled();
  });
});

describe("DeactivateTeacherDialog (RF-PRO-04)", () => {
  let preview: () => Response | Promise<Response>;
  let deactivated: number;
  let body: unknown;
  let current: TeacherDetail;
  const loaded = (d: HTMLElement) => waitFor(() => expect(within(d).queryByText("Carregando...")).toBeNull());
  const open = async (user: ReturnType<typeof userEvent.setup>, teacher = detail()) => {
    current = teacher;
    deactivated = 0;
    preview = () => HttpResponse.json({ headClasses: [], assistantClasses: [], canDeactivate: true });
    setup(() => HttpResponse.json(current));
    server.use(
      http.get("/api/v1/teachers/t1/deactivation", () => preview()),
      http.post("/api/v1/teachers/t1/deactivate", async ({ request }) => {
        body = await request.json();
        deactivated += 1;
        current = detail({ status: "INACTIVE", access: teacher.access === "NONE" ? "NONE" : "ENDED" });
        return HttpResponse.json(current);
      }),
    );
    await ready();
    await waitFor(() => expect(screen.getByRole("button", { name: "Inativar" })).toBeEnabled()); // as permissões chegam depois do painel
    await user.click(screen.getByRole("button", { name: "Inativar" }));
    return screen.findByRole("dialog", { name: "Inativar Ana Souza" });
  };

  it("CA9, CA11: sem turmas só mostra resumo e motivo; confirmar atualiza o painel para Inativo e fecha a janela", async () => {
    const user = userEvent.setup();
    const dialog = await open(user);
    await loaded(dialog);
    expect(within(dialog).queryByText(/ficam? sem titular/)).toBeNull();
    expect(within(dialog).getByText(/O acesso dele é desligado agora/)).toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox", { name: /Motivo/ }), "Mudou de cidade");
    await user.click(within(dialog).getByRole("button", { name: "Inativar professor" }));
    expect(await screen.findByText("Professor inativado.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Inativar Ana Souza" })).toBeNull());
    expect(deactivated).toBe(1);
    expect(screen.getByText("Inativo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inativar" })).toBeDisabled();
  });

  it("CA9: lista as turmas sem titular e avisa que o acesso será encerrado quando há conta", async () => {
    const user = userEvent.setup();
    const dialog = await open(user, detail({ access: "ACTIVE" }));
    await loaded(dialog);
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    preview = () =>
      HttpResponse.json({
        headClasses: [
          { id: "c1", name: "Jiu-Jitsu Noite", role: "HEAD", unitName: "Centro", candidates: [{ id: "t2", name: "Rafael Duarte" }] },
          { id: "c2", name: "Jiu-Jitsu Kids", role: "HEAD", unitName: "Centro", candidates: [] },
        ],
        assistantClasses: [{ id: "c3", name: "Jiu-Jitsu Adulto", role: "ASSISTANT", unitName: "Norte" }],
        canDeactivate: true,
      });
    await user.click(screen.getByRole("button", { name: "Inativar" }));
    const again = await screen.findByRole("dialog");
    expect(await within(again).findByText("2 turmas ficam sem titular")).toBeInTheDocument();
    for (const h of ["Turma", "Papel", "Novo titular"]) expect(within(again).getByRole("columnheader", { name: h })).toBeInTheDocument();
    expect(within(again).getByText("Jiu-Jitsu Noite (Centro)")).toBeInTheDocument();
    expect(within(again).getByText("sai da turma")).toBeInTheDocument();
    expect(within(again).getByText(/O acesso dele é desligado agora/)).toBeInTheDocument();
    // sem motivo o botão não chama a API; com motivo e um novo titular a chamada leva reason e replacements só das turmas escolhidas
    await user.click(within(again).getByRole("button", { name: "Inativar professor" }));
    expect(deactivated).toBe(0);
    await user.selectOptions(within(again).getByLabelText("Novo titular de Jiu-Jitsu Noite"), "Rafael Duarte");
    await user.type(within(again).getByRole("textbox", { name: "Motivo *" }), "Mudou de cidade");
    await user.click(within(again).getByRole("button", { name: "Inativar professor" }));
    await waitFor(() => expect(deactivated).toBe(1));
    expect(body).toEqual({ reason: "Mudou de cidade", replacements: [{ classId: "c1", teacherId: "t2" }] });
  });

  it("CA9: Administrador fora do alcance vê o aviso e não confirma", async () => {
    const user = userEvent.setup();
    const dialog = await open(user);
    preview = () => HttpResponse.json({ headClasses: [], assistantClasses: [], canDeactivate: false });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Inativar" }));
    const again = await screen.findByRole("dialog");
    expect(await within(again).findByText(/Só o Coordenador inativa este professor/)).toBeInTheDocument();
    expect(within(again).getByRole("button", { name: "Inativar professor" })).toBeDisabled();
    expect(deactivated).toBe(0);
  });

  it("CA9: erro da pré-visualização mostra Tentar de novo; 409 e 403 do servidor aparecem na janela", async () => {
    const user = userEvent.setup();
    const dialog = await open(user);
    await loaded(dialog);
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    preview = () => HttpResponse.json({}, { status: 500 });
    await user.click(screen.getByRole("button", { name: "Inativar" }));
    const failed = await screen.findByRole("dialog");
    expect(await within(failed).findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    preview = () => HttpResponse.json({ headClasses: [], assistantClasses: [], canDeactivate: true });
    await user.click(within(failed).getByRole("button", { name: "Tentar de novo" }));
    await loaded(failed);
    server.use(http.post("/api/v1/teachers/t1/deactivate", () => HttpResponse.json({ code: "CONFLICT" }, { status: 409 })));
    await user.type(within(failed).getByRole("textbox", { name: /Motivo/ }), "Mudou de cidade");
    await user.click(within(failed).getByRole("button", { name: "Inativar professor" }));
    expect(await within(failed).findByText("Este professor já está inativo.")).toBeInTheDocument();
    server.use(http.post("/api/v1/teachers/t1/deactivate", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 })));
    await user.click(within(failed).getByRole("button", { name: "Inativar professor" }));
    expect(await within(failed).findByText(/Você não tem permissão para inativar/)).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA9: a janela a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const user = userEvent.setup();
    const dialog = await open(user, detail({ access: "ACTIVE" }));
    await loaded(dialog);
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
