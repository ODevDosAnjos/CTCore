import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { TeacherDetail, TeacherOptions } from "./useTeachers";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const options: TeacherOptions = {
  modalities: [
    { id: "m1", name: "Jiu-Jitsu", graduationEnabled: true, levels: [{ id: "l1", name: "Branca", maxDegree: 4 }, { id: "l2", name: "Azul", maxDegree: 4 }] },
    { id: "m2", name: "Judô", graduationEnabled: false, levels: [] },
  ],
};
const detail = (over: Partial<TeacherDetail> = {}): TeacherDetail => ({
  id: "t1",
  name: "Ana Souza",
  photoUrl: null,
  bio: "Faixa preta.",
  email: "ana@alfa.test",
  phone: "11912345678",
  directoryConsent: true,
  consentDeclaredByManagement: true,
  status: "ACTIVE",
  modalities: [{ id: "m1", name: "Jiu-Jitsu", levelId: "l2", level: "Azul", degree: 3, levelColor: "#1E40AF", levelSecondaryColor: null }],
  units: [{ id: "u1", name: "Centro" }],
  classes: [],
  upcomingClasses: [],
  substitutions: [],
  lastAccessAt: null,
  access: "NONE",
  ...over,
});

// jsdom não decodifica imagem nem desenha em canvas: Image, URL e canvas são trocados por simulações (como no teste do corte).
class FakeImage {
  width = 800;
  height = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_: string) {
    queueMicrotask(() => this.onload?.());
  }
}
beforeEach(() => {
  vi.stubGlobal("Image", FakeImage);
  URL.createObjectURL = vi.fn(() => "blob:foto");
  URL.revokeObjectURL = vi.fn();
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({ drawImage: vi.fn() })) as never;
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb: BlobCallback) => cb(new Blob(["png"], { type: "image/png" }))) as never;
});
afterEach(() => vi.unstubAllGlobals());

let sent: { method: string; url: string; body: unknown }[];
let current: TeacherDetail;

function setup(opts: { role?: string; path?: string; optionsResponse?: () => Response | Promise<Response> } = {}) {
  const role = opts.role ?? "COORDINATOR";
  const path = opts.path ?? "/professores";
  sent = [];
  current = detail();
  window.history.replaceState(null, "", path);
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro", shortName: "c" }, { id: "u2", name: "Norte", shortName: "n" }] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([])),
    http.get("/api/v1/teachers", () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0 })),
    http.get("/api/v1/teachers/options", () => (opts.optionsResponse ? opts.optionsResponse() : HttpResponse.json(options))),
    http.get("/api/v1/teachers/t1", () => HttpResponse.json(current)),
    http.get("/api/v1/teachers/n1", () => HttpResponse.json(detail({ id: "n1", name: "Nova Pessoa" }))),
    http.post("/api/v1/teachers", async ({ request }) => {
      sent.push({ method: "POST", url: "/teachers", body: await request.json() });
      return HttpResponse.json(detail({ id: "n1", name: "Nova Pessoa" }), { status: 201 });
    }),
    http.post("/api/v1/teachers/n1/access", async ({ request }) => {
      sent.push({ method: "POST", url: "/teachers/n1/access", body: await request.json() });
      return HttpResponse.json(detail({ id: "n1", name: "Nova Pessoa", access: "PENDING" }));
    }),
    http.put("/api/v1/teachers/t1", async ({ request }) => {
      const body = (await request.json()) as { name: string };
      sent.push({ method: "PUT", url: "/teachers/t1", body });
      current = detail({ name: body.name });
      return HttpResponse.json(current);
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const fillNew = async (user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) => {
  await user.type(await within(dialog).findByLabelText("Nome completo *"), "Nova Pessoa");
  await user.type(within(dialog).getByLabelText("E-mail *"), "nova@alfa.test");
  await user.type(within(dialog).getByLabelText("Celular *"), "11988887777");
  await user.click(within(dialog).getByRole("checkbox", { name: "Centro" }));
};

const openNew = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole("button", { name: "Novo professor" }));
  return screen.findByRole("dialog", { name: "Novo professor" });
};

describe("TeacherFormDialog (RF-PRO-03, CA12)", () => {
  it("cria: valida no cliente, envia o corpo do contrato e leva ao painel do professor novo", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await openNew(user);
    await within(dialog).findByLabelText("Nome completo *");
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(within(dialog).getByText("Informe o nome, de 2 a 80 caracteres.")).toBeInTheDocument();
    expect(within(dialog).getByText("Informe o e-mail.")).toBeInTheDocument();
    expect(within(dialog).getByText("Informe o celular.")).toBeInTheDocument();
    expect(within(dialog).getByText("Escolha ao menos uma unidade.")).toBeInTheDocument();
    expect(sent).toEqual([]);

    await user.type(within(dialog).getByLabelText("Nome completo *"), "  Nova Pessoa ");
    await user.type(within(dialog).getByLabelText("E-mail *"), "nova@alfa.test");
    await user.type(within(dialog).getByLabelText("Celular *"), "11988887777");
    expect(within(dialog).getByLabelText("Celular *")).toHaveValue("(11) 98888-7777");
    await user.click(within(dialog).getByRole("checkbox", { name: "Centro" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Judô" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "Jiu-Jitsu" }));
    expect(within(dialog).getByText("Graduação · Jiu-Jitsu")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(within(dialog).getByText("Escolha o nível de cada modalidade marcada.")).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText("Nível em Jiu-Jitsu"), "Azul");
    await user.selectOptions(within(dialog).getByLabelText("Grau em Jiu-Jitsu"), "2");
    await user.click(within(dialog).getByRole("switch", { name: "Aceita aparecer no diretório de academias" }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(within(dialog).getByText("Marque que o professor autorizou para aparecer no diretório.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("checkbox", { name: "O professor autorizou" }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));

    expect(await screen.findByRole("heading", { name: "Nova Pessoa", level: 2 })).toBeInTheDocument();
    expect(sent).toEqual([
      {
        method: "POST",
        url: "/teachers",
        body: {
          name: "Nova Pessoa",
          email: "nova@alfa.test",
          phone: "11988887777",
          bio: null,
          directoryConsent: true,
          consentDeclaredByManagement: true,
          unitIds: ["u1"],
          modalities: [{ modalityId: "m1", levelId: "l2", degree: 2 }, { modalityId: "m2", levelId: null, degree: null }],
        },
      },
      { method: "POST", url: "/teachers/n1/access", body: { unitIds: ["u1"] } },
    ]);
  });

  it("a apresentação mostra o contador n/300", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await openNew(user);
    expect(await within(dialog).findByText("0 de 300")).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("Apresentação (aparece no diretório)"), "Olá!");
    expect(within(dialog).getByText("4 de 300")).toBeInTheDocument();
  });

  it("erro 400 do servidor aparece no campo; o formulário continua aberto", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.post("/api/v1/teachers", () => HttpResponse.json({ code: "VALIDATION_ERROR", fields: [{ field: "email", message: "e-mail inválido" }] }, { status: 400 })));
    const dialog = await openNew(user);
    await fillNew(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(await within(dialog).findByText("e-mail inválido")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("E-mail *")).toHaveAttribute("aria-invalid", "true");
  });

  it("falha geral mostra a mensagem do formulário", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.post("/api/v1/teachers", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    const dialog = await openNew(user);
    await fillNew(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(await within(dialog).findByText("Não foi possível salvar. Tente de novo.")).toBeInTheDocument();
  });

  it("opções: com erro oferece Tentar de novo e depois mostra o formulário", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup({ optionsResponse: () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(options)) });
    const dialog = await openNew(user);
    const retry = await within(dialog).findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await within(dialog).findByLabelText("Nome completo *")).toBeInTheDocument();
  });

  it("opções: enquanto carregam mostra Carregando", async () => {
    const user = userEvent.setup();
    setup({ optionsResponse: () => new Promise(() => undefined) });
    const dialog = await openNew(user);
    expect(within(dialog).getByText("Carregando...")).toBeInTheDocument();
  });

  it("edita a partir do painel: abre preenchido, envia PUT e o painel mostra o nome novo; sem foto mostra iniciais", async () => {
    const user = userEvent.setup();
    setup({ path: "/professores/t1" });
    await screen.findByRole("heading", { name: "Ana Souza", level: 2 });
    await user.click(await screen.findByRole("button", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar professor" });
    const name = await within(dialog).findByLabelText("Nome completo *");
    expect(name).toHaveValue("Ana Souza");
    expect(within(dialog).getByLabelText("Celular *")).toHaveValue("(11) 91234-5678");
    expect(within(dialog).getByRole("checkbox", { name: "Centro" })).toBeChecked();
    expect(within(dialog).getByRole("checkbox", { name: "Norte" })).not.toBeChecked();
    expect(within(dialog).getByLabelText("Nível em Jiu-Jitsu")).toHaveValue("l2");
    expect(within(dialog).getByLabelText("Grau em Jiu-Jitsu")).toHaveValue("3");
    expect(within(dialog).getByText("AS")).toBeInTheDocument();
    expect(within(dialog).getByText("12 de 300")).toBeInTheDocument();
    await user.clear(name);
    await user.type(name, "Ana Maria");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("heading", { name: "Ana Maria", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Dados salvos.")).toBeInTheDocument();
    expect(sent[0]).toMatchObject({ method: "PUT", body: { name: "Ana Maria", unitIds: ["u1"], modalities: [{ modalityId: "m1", levelId: "l2", degree: 3 }] } });
  });

  it("RN-PRO-09: modalidade retirada com turma ativa (409) mostra a mensagem e as turmas que impedem; o formulário continua aberto", async () => {
    const user = userEvent.setup();
    setup({ path: "/professores/t1" });
    server.use(
      http.put("/api/v1/teachers/t1", () =>
        HttpResponse.json(
          { code: "TEACHER_MODALITY_IN_USE", message: "x", changed: false, fields: [{ field: "class", message: "Jiu-Jitsu Adulto" }, { field: "class", message: "Jiu-Jitsu Kids" }] },
          { status: 409 },
        ),
      ),
    );
    await screen.findByRole("heading", { name: "Ana Souza", level: 2 });
    await user.click(await screen.findByRole("button", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar professor" });
    await within(dialog).findByLabelText("Nome completo *");
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await within(dialog).findByText(/não pode deixar de ensinar uma modalidade/)).toBeInTheDocument();
    expect(within(dialog).getByText("Jiu-Jitsu Adulto")).toBeInTheDocument();
    expect(within(dialog).getByText("Jiu-Jitsu Kids")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar professor" })).toBeInTheDocument();
  });

  it("foto: o corte é enviado depois de salvar; se falhar, o cadastro fica salvo e dá para tentar de novo", async () => {
    const user = userEvent.setup();
    setup();
    let photoCalls = 0;
    server.use(
      http.put("/api/v1/teachers/n1/photo", () => {
        photoCalls += 1;
        return photoCalls === 1 ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(detail({ id: "n1", name: "Nova Pessoa" }));
      }),
    );
    const dialog = await openNew(user);
    await fillNew(user, dialog);
    fireEvent.change(within(dialog).getByLabelText("Arquivo da foto", { selector: "input" }), { target: { files: [new File(["x"], "f.png", { type: "image/png" })] } });
    const crop = await screen.findByRole("dialog", { name: "Cortar a foto" });
    const confirm = await within(crop).findByRole("button", { name: "Usar este corte" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await within(dialog).findByText("Foto escolhida. Ela é enviada ao salvar.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(await within(dialog).findByText("O cadastro foi salvo, mas a foto não foi enviada.")).toBeInTheDocument();
    expect(sent).toHaveLength(2);
    await user.click(within(dialog).getByRole("button", { name: "Tentar enviar a foto de novo" }));
    expect(await screen.findByRole("heading", { name: "Nova Pessoa", level: 2 })).toBeInTheDocument();
    expect(sent).toHaveLength(2);
    expect(photoCalls).toBe(2);
  });

  it("sem o interruptor de acesso o botão diz Salvar e só chama POST /teachers", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await openNew(user);
    await fillNew(user, dialog);
    await user.click(within(dialog).getByRole("switch", { name: "Dar acesso à gestão como Professor" }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar" }));
    expect(await screen.findByRole("heading", { name: "Nova Pessoa", level: 2 })).toBeInTheDocument();
    expect(sent.map((c) => c.url)).toEqual(["/teachers"]);
  });

  it("convite que falha (409): o cadastro fica salvo e Tentar de novo repete só o convite", async () => {
    const user = userEvent.setup();
    setup();
    let calls = 0;
    server.use(
      http.post("/api/v1/teachers/n1/access", () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({ code: "STAFF_LIMIT_REACHED" }, { status: 409 }) : HttpResponse.json(detail({ id: "n1", name: "Nova Pessoa", access: "PENDING" }));
      }),
    );
    const dialog = await openNew(user);
    await fillNew(user, dialog);
    await user.click(within(dialog).getByRole("button", { name: "Salvar e enviar convite" }));
    expect(await within(dialog).findByText("O cadastro foi salvo, mas o convite não foi enviado.")).toBeInTheDocument();
    expect(within(dialog).getByText("A organização atingiu o limite de 200 usuários da gestão.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: "Nova Pessoa", level: 2 })).toBeInTheDocument();
    expect(sent.filter((c) => c.url === "/teachers")).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it("RN-PRO-09: desmarcar a modalidade com turma ativa mostra o aviso na hora e trava o Salvar; remarcar libera", async () => {
    const user = userEvent.setup();
    setup({ path: "/professores/t1" });
    current = detail({
      classes: [
        { id: "c1", name: "Jiu-Jitsu Adulto · Manhã", role: "HEAD", modalityId: "m1", unitName: "Centro", schedule: [] },
        { id: "c2", name: "Jiu-Jitsu Kids", role: "HEAD", modalityId: "m1", unitName: "Centro", schedule: [] },
        { id: "c3", name: "Jiu-Jitsu Adulto · Noite", role: "ASSISTANT", modalityId: "m1", unitName: "Norte", schedule: [] },
      ],
    });
    await screen.findByRole("heading", { name: "Ana Souza", level: 2 });
    await user.click(await screen.findByRole("button", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar professor" });
    await within(dialog).findByLabelText("Nome completo *");
    await user.click(within(dialog).getByRole("checkbox", { name: "Jiu-Jitsu" }));
    expect(within(dialog).getByText("O Jiu-Jitsu não pode sair do Ana")).toBeInTheDocument();
    expect(within(dialog).getByText("Titular: Jiu-Jitsu Adulto · Manhã e Jiu-Jitsu Kids (Centro)")).toBeInTheDocument();
    expect(within(dialog).getByText("Auxiliar: Jiu-Jitsu Adulto · Noite (Norte)")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(sent).toEqual([]);
    await user.click(within(dialog).getByRole("checkbox", { name: "Jiu-Jitsu" }));
    expect(within(dialog).queryByText("O Jiu-Jitsu não pode sair do Ana")).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Salvar" })).toBeEnabled();
  });

  it("foto: tipo inválido é recusado antes do corte", async () => {
    const user = userEvent.setup();
    setup();
    const dialog = await openNew(user);
    fireEvent.change(await within(dialog).findByLabelText("Arquivo da foto", { selector: "input" }), { target: { files: [new File(["x"], "f.gif", { type: "image/gif" })] } });
    expect(await within(dialog).findByText("Use uma imagem PNG, JPG ou WebP.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Cortar a foto" })).toBeNull();
  });

  it("quem não tem TEACHERS não vê Novo professor", async () => {
    setup({ role: "TEACHER" });
    await waitFor(() => expect(screen.queryByText("Carregando...")).toBeNull());
    expect(screen.queryByRole("button", { name: "Novo professor" })).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px a janela não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const user = userEvent.setup();
    setup();
    const dialog = await openNew(user);
    await within(dialog).findByLabelText("Nome completo *");
    expect(await axeViolations(dialog)).toEqual([]);
  });
});
