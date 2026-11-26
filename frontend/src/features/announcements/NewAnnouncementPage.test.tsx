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
import type { AnnouncementDraft, AnnouncementTargets } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const full: AnnouncementTargets = {
  organization: true,
  units: [{ id: "u1", name: "Unidade Centro" }],
  modalities: [{ id: "m1", name: "Jiu-Jitsu", unitId: "u1" }],
  classes: [
    { id: "k1", name: "Jiu-Jitsu Adulto", unitId: "u1", modalityId: "m1", groupLink: "https://chat.example.com/jj" },
    { id: "k2", name: "Judô Infantil", unitId: "u1", modalityId: "m2", groupLink: null },
  ],
};
const teacher: AnnouncementTargets = { organization: false, units: [], modalities: [], classes: [full.classes[0]] };
const preview = (recipients: number, whatsapp: unknown = null) => HttpResponse.json({ recipients, adults: recipients - 2, guardians: 2, portal: recipients, email: recipients - 1, whatsapp, channels: ["PORTAL"] });
const failure = (status: number, code: string, fields: { field: string; message: string }[] = []) => HttpResponse.json({ code, message: "m", fields, traceId: "t" }, { status });

const platform = {
  CANCELED_CLASS: { title: "Aula cancelada", body: "A aula de {turma} do dia {data}, às {horario}, foi cancelada. Avisaremos quando houver reposição." },
  TEACHER_CHANGE: { title: "Troca de professor", body: "A aula de {turma} terá outro professor a partir de {data}." },
  SCHEDULE_CHANGE: { title: "Mudança de horário", body: "A aula de {turma} muda de horário a partir de {data}. O novo horário é {horario}." },
  NO_CLASS_DAY: { title: "Dia sem aula", body: "Não haverá aula em {periodo}: {motivo}." },
  GENERAL: { title: "Aviso geral", body: "" },
};

let previews: AnnouncementDraft[];
let creates: AnnouncementDraft[];

type Options = { role?: string; templates?: typeof platform; targets?: AnnouncementTargets; targetsResponse?: () => Response; create?: () => Response; path?: string; daily?: number };
function setup({ role = "COORDINATOR", templates = platform, targets = full, targetsResponse, create, path = "/comunicados/novo", daily }: Options = {}) {
  previews = [];
  creates = [];
  window.history.replaceState(null, "", path);
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role as never) })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json(daily === undefined ? { allUnits: true, units: [] } : { allUnits: false, units: [{ id: "u1", name: "Tijuca", shortName: "Tij" }] })),
    http.get("/api/v1/announcements/daily-limit", () => HttpResponse.json({ unit: { id: "u1", name: "Tijuca", used: daily ?? 0, limit: 20 }, organization: null })),
    http.get("/api/v1/announcements/targets", () => targetsResponse?.() ?? HttpResponse.json(targets)),
    http.get("/api/v1/announcements/templates", () => HttpResponse.json({ templates })),
    http.post("/api/v1/announcements/preview", async ({ request }) => {
      const draft = (await request.json()) as AnnouncementDraft;
      previews.push(draft);
      return preview(draft.targetKind === "CLASS" ? 8 : 25, draft.channels.includes("WHATSAPP") ? { mode: "GROUP", groupLink: "https://chat.example.com/jj" } : null);
    }),
    http.post("/api/v1/announcements", async ({ request }) => {
      creates.push((await request.json()) as AnnouncementDraft);
      return create?.() ?? HttpResponse.json({ id: "n1", status: "SENT", recipients: 8 }, { status: 201 });
    }),
    http.get("/api/v1/announcements", () => HttpResponse.json({ items: [], page: 1, size: 25, total: 0 })),
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

const ready = () => screen.findByRole("heading", { name: "Novo comunicado", level: 1 });
const targetSelect = () => screen.getByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
const optionNames = () => within(targetSelect()).getAllByRole("option").map((o) => o.textContent);
const radios = () => within(screen.getByRole("group", { name: "Destino" })).getAllByRole("radio").map((r) => r.closest("label")?.textContent);

describe("NewAnnouncementPage (RF-COM-02)", () => {
  it("CA4 (#720): só o título; o subtítulo da contagem aparece quando faltam 5 ou menos", async () => {
    const { unmount } = setup({ daily: 3 });
    await ready();
    await screen.findByRole("combobox", { name: "Turma" });
    expect(screen.queryByText(/comunicados hoje/)).toBeNull();
    expect(screen.queryByText(/Escolha para quem o aviso vai/)).toBeNull();
    expect(screen.queryByText(/Unidade Tijuca/)).toBeNull();
    unmount();
    setup({ daily: 16 });
    await ready();
    expect(await screen.findByText("16 de 20 comunicados hoje")).toBeInTheDocument();
  });


  it("CA9: o Coordenador vê quatro cartões de destino; o Professor, só o de turma, com as turmas dele", async () => {
    const user = userEvent.setup();
    const { unmount } = setup();
    await ready();
    await screen.findByRole("combobox", { name: "Turma" });
    expect(radios()).toEqual(["Turma", "Modalidade", "Unidade", "Todas as unidadesSó o Coordenador"]);
    expect(optionNames()).toEqual(["Escolha o destino", "Jiu-Jitsu Adulto", "Judô Infantil"]);
    await user.click(screen.getByRole("radio", { name: "Modalidade" }));
    expect(optionNames()).toEqual(["Escolha o destino", "Jiu-Jitsu · Unidade Centro"]);
    await user.click(screen.getByRole("radio", { name: "Unidade" }));
    expect(optionNames()).toEqual(["Escolha o destino", "Unidade Centro"]);
    unmount();
    setup({ role: "TEACHER", targets: teacher });
    await ready();
    await screen.findByRole("combobox", { name: "Turma" });
    expect(radios()).toEqual(["Turma"]);
    expect(optionNames()).toEqual(["Escolha o destino", "Jiu-Jitsu Adulto"]);
  });

  it("CA9: escolher Todas as unidades abre a janela da organização sobre a lista", async () => {
    const user = userEvent.setup();
    setup({ templates: platform });
    await ready();
    await screen.findByRole("combobox", { name: "Turma" });
    await user.click(screen.getByRole("radio", { name: /Todas as unidades/ }));
    expect(await screen.findByRole("radio", { name: /Organização inteira/ })).toBeChecked();
    expect(screen.getByRole("dialog", { name: "Novo comunicado" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Comunicados", level: 1, hidden: true })).toBeInTheDocument();
  });

  it("CA7 (#450): Push e Salvar rascunho aparecem desabilitados com Em breve e o envio não leva PUSH", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await user.selectOptions(await screen.findByRole("combobox", { name: "Turma" }), "Jiu-Jitsu Adulto");
    const push = screen.getByRole("switch", { name: "Push" });
    const draft = screen.getByRole("button", { name: "Salvar rascunho" });
    for (const el of [push, draft]) {
      expect(el).toHaveAttribute("aria-disabled", "true");
      await user.click(el);
    }
    expect(push).toHaveAttribute("aria-checked", "false");
    expect(screen.getAllByText("Em breve")).toHaveLength(3);
    await user.type(screen.getByLabelText("Título"), "Aviso");
    await user.type(screen.getByLabelText("Texto"), "Corpo");
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    await waitFor(() => expect(creates).toHaveLength(1));
    expect(creates[0].channels).not.toContain("PUSH");
  });

  it("CA23: sem destino não há prévia e Enviar fica desabilitado; com destino a prévia conta pessoas e canais e se atualiza com os canais", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(screen.getByRole("status", { name: "Para quem vai" })).toHaveTextContent("Escolha o destino para ver quem recebe.");
    expect(screen.getByRole("button", { name: "Enviar comunicado" })).toBeDisabled();
    await user.selectOptions(targetSelect(), "Jiu-Jitsu Adulto");
    expect(await screen.findByText("8 alunos")).toBeInTheDocument();
    expect(screen.getByText("recebem: 6 adultos e 2 responsáveis de menores")).toBeInTheDocument();
    expect(screen.getByText("Portal: 8 · E-mail: 7 (1 desligou os avisos da academia)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar comunicado" })).toBeEnabled();
    await user.click(screen.getByRole("checkbox", { name: /^WhatsApp/ }));
    expect(await screen.findByText("WhatsApp: grupo da turma")).toBeInTheDocument();
    expect(previews.at(-1)).toMatchObject({ targetKind: "CLASS", classId: "k1", channels: ["PORTAL", "WHATSAPP"] });
    await user.click(screen.getByRole("radio", { name: "Unidade" }));
    await user.selectOptions(targetSelect(), "Unidade Centro");
    expect(await screen.findByText("25 alunos")).toBeInTheDocument();
  });

  it("CA23: escolher o tipo preenche título e texto; mudar depois de editar pergunta antes de trocar", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?classId=k1" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    await user.click(screen.getByRole("radio", { name: "Alteração de horário" }));
    expect(screen.getByLabelText("Título")).toHaveValue("Mudança de horário");
    expect(screen.getByLabelText("Texto")).toHaveValue("A aula de Jiu-Jitsu Adulto muda de horário a partir de [data]. O novo horário é [horário].");
    await user.click(screen.getByRole("radio", { name: "Troca de professor" }));
    expect(screen.getByLabelText("Título")).toHaveValue("Troca de professor");
    await user.type(screen.getByLabelText("Título"), " nova");
    await user.click(screen.getByRole("radio", { name: "Aviso geral" }));
    expect(screen.getByRole("alert")).toHaveTextContent("substitui o título e o texto");
    await user.click(screen.getByRole("button", { name: "Manter meu texto" }));
    expect(screen.getByLabelText("Título")).toHaveValue("Troca de professor nova");
    await user.click(screen.getByRole("radio", { name: "Aviso geral" }));
    await user.click(screen.getByRole("button", { name: "Trocar o texto" }));
    expect(screen.getByLabelText("Título")).toHaveValue("Aviso geral");
    expect(screen.getByLabelText("Texto")).toHaveValue("");
  });

  it("CA26: a URL preenche turma, tipo, data e horário no texto pronto", async () => {
    setup({ path: "/comunicados/novo?classId=k1&type=CANCELED_CLASS&date=2026-11-03&time=19:00" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(targetSelect()).toHaveValue("CLASS:k1");
    expect(screen.getByRole("radio", { name: "Aula cancelada" })).toBeChecked();
    expect(screen.getByLabelText("Texto")).toHaveValue("A aula de Jiu-Jitsu Adulto do dia 03/11/2026, às 19:00, foi cancelada. Avisaremos quando houver reposição.");
    expect(await screen.findByText("8 alunos")).toBeInTheDocument();
  });

  it("CA26: type=GENERAL com a turma abre Aviso geral com a turma escolhida", async () => {
    setup({ path: "/comunicados/novo?classId=k1&type=GENERAL&date=2026-11-03&time=19:00" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(targetSelect()).toHaveValue("CLASS:k1");
    expect(screen.getByRole("radio", { name: "Aviso geral" })).toBeChecked();
    expect(screen.getByLabelText("Título")).toHaveValue("Aviso geral");
    expect(screen.getByLabelText("Texto")).toHaveValue("");
  });

  it("CA26: type desconhecido cai em Aviso geral com texto vazio", async () => {
    setup({ path: "/comunicados/novo?classId=k1&type=INVENTADO" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(screen.getByRole("radio", { name: "Aviso geral" })).toBeChecked();
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Texto")).toHaveValue("");
  });

  it("CA18: o texto próprio do servidor é o inicial do tipo, com {turma}, {data} e {horario} preenchidos e [marcador] no que a tela não sabe", async () => {
    const own = { ...platform, CANCELED_CLASS: { title: "Hoje não tem {turma}", body: "Sem {turma} em {data} às {horario} ({unidade}). {inventado}" } };
    setup({ templates: own, path: "/comunicados/novo?classId=k1&type=CANCELED_CLASS&date=2026-11-03" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(screen.getByLabelText("Título")).toHaveValue("Hoje não tem Jiu-Jitsu Adulto");
    expect(screen.getByLabelText("Texto")).toHaveValue("Sem Jiu-Jitsu Adulto em 03/11/2026 às [horário] ([unidade]). {inventado}");
  });

  it("CA26: o dia sem aula chega pela URL com a unidade, o período, o motivo e o vínculo ao dia", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?type=NO_CLASS_DAY&unitId=u1&startsOn=2026-12-24&endsOn=2026-12-26&reason=Recesso&noClassDayId=d1" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(targetSelect()).toHaveValue("UNIT:u1");
    expect(screen.getByLabelText("Texto")).toHaveValue("Não haverá aula em 24/12/2026 a 26/12/2026: Recesso.");
    await screen.findByText("25 alunos");
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    await waitFor(() => expect(creates).toHaveLength(1));
    expect(creates[0]).toMatchObject({ targetKind: "UNIT", unitId: "u1", type: "NO_CLASS_DAY", noClassDayId: "d1" });
  });

  it("CA25: o campo de agendamento só aparece em Agendar; enviar leva a /comunicados com a confirmação", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?classId=k1" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    expect(screen.queryByLabelText("Data e hora do envio")).toBeNull();
    await user.type(screen.getByLabelText("Título"), "Recesso");
    await user.type(screen.getByLabelText("Texto"), "Sem aula na sexta.");
    await user.click(screen.getByRole("checkbox", { name: "E-mail" }));
    await user.click(screen.getByRole("radio", { name: /^Agendar/ }));
    expect(screen.getByRole("button", { name: "Agendar comunicado" })).toBeDisabled();
    await user.type(screen.getByLabelText("Data e hora do envio"), "2099-01-01T10:00");
    await user.click(screen.getByRole("radio", { name: "Enviar agora" }));
    expect(screen.queryByLabelText("Data e hora do envio")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    expect(await screen.findByRole("heading", { name: "Comunicados", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Comunicado enviado.")).toBeInTheDocument();
    expect(creates).toEqual([{ targetKind: "CLASS", classId: "k1", type: "GENERAL", title: "Recesso", body: "Sem aula na sexta.", channels: ["PORTAL", "EMAIL"] }]);
  });

  it("CA25: agendar envia o instante escolhido e a confirmação é de agendado", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?classId=k1", create: () => HttpResponse.json({ id: "n1", status: "SCHEDULED", recipients: null }, { status: 201 }) });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    await user.type(screen.getByLabelText("Título"), "Aviso");
    await user.type(screen.getByLabelText("Texto"), "Texto");
    await user.click(screen.getByRole("radio", { name: /^Agendar/ }));
    await user.type(screen.getByLabelText("Data e hora do envio"), "2099-01-01T10:00");
    await user.type(screen.getByLabelText("Fixar no topo do portal até (opcional)"), "2099-01-05");
    await user.click(screen.getByRole("button", { name: "Agendar comunicado" }));
    expect(await screen.findByText("Comunicado agendado.")).toBeInTheDocument();
    expect(creates[0].sendAt).toBe(new Date("2099-01-01T10:00").toISOString());
    expect(creates[0].pinnedUntil).toBe("2099-01-05");
  });

  it("CA24: WhatsApp em grupo deixa o link do grupo na confirmação", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?classId=k1" });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    await user.type(screen.getByLabelText("Título"), "Aviso");
    await user.type(screen.getByLabelText("Texto"), "Texto");
    await user.click(screen.getByRole("checkbox", { name: /^WhatsApp/ }));
    await screen.findByText("WhatsApp: grupo da turma");
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    expect(await screen.findByRole("link", { name: "Abrir o grupo da turma" })).toHaveAttribute("href", "https://chat.example.com/jj");
  });

  it("CA24: 400 com campo mostra a mensagem junto do campo, mantém o formulário e leva o foco ao primeiro erro", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?classId=k1", create: () => failure(400, "VALIDATION_ERROR", [{ field: "body", message: "x" }, { field: "title", message: "y" }]) });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    await user.type(screen.getByLabelText("Texto"), "Meu texto");
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    const title = screen.getByLabelText("Título");
    await waitFor(() => expect(title).toHaveFocus());
    expect(title).toHaveAccessibleDescription("Informe o título, de 1 a 120 caracteres.");
    expect(screen.getByLabelText("Texto")).toHaveValue("Meu texto");
    expect(screen.getByText(/Informe o texto, de 1 a 2.000/)).toBeInTheDocument();
  });

  it("CA24: 409 do limite e 403 aparecem no topo, sem perder o que foi escrito", async () => {
    const user = userEvent.setup();
    let status = 409;
    setup({ path: "/comunicados/novo?classId=k1", create: () => (status === 409 ? failure(409, "ANNOUNCEMENT_DAILY_LIMIT") : failure(403, "FORBIDDEN")) });
    await ready();
    await screen.findByRole("combobox", { name: /^(Turma|Modalidade|Unidade)$/ });
    await user.type(screen.getByLabelText("Título"), "Aviso");
    await user.type(screen.getByLabelText("Texto"), "Texto");
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    const alert = await screen.findByText(/limite de 20 comunicados por dia/);
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.getByLabelText("Título")).toHaveValue("Aviso");
    status = 403;
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    expect(await screen.findByText("Você não pode enviar comunicado para este destino.")).toBeInTheDocument();
    expect(screen.getByLabelText("Texto")).toHaveValue("Texto");
  });

  it("CA25: carregando, erro com Tentar de novo, sem permissão e vazio do Professor sem turma", async () => {
    const user = userEvent.setup();
    let mode: "error" | "ok" = "error";
    const first = setup({ targetsResponse: () => (mode === "error" ? failure(500, "X") : HttpResponse.json(full)) });
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    mode = "ok";
    await user.click(retry);
    expect(await screen.findByRole("combobox", { name: "Turma" })).toBeInTheDocument();
    first.unmount();
    const second = setup({ targetsResponse: () => failure(403, "FORBIDDEN") });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
    second.unmount();
    setup({ role: "TEACHER", targets: { organization: false, units: [], modalities: [], classes: [] } });
    expect(await screen.findByText("Você não tem turmas liberadas para enviar comunicado.")).toBeInTheDocument();
  });

  it("CA25: a 360 px o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { container, unmount } = setup({ path: "/comunicados/novo?classId=k1&type=CANCELED_CLASS&date=2026-11-03&time=19:00" });
      await ready();
      await screen.findByText("8 alunos");
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("R14/R15: a coluna Prévia mostra como aparece no portal; Portal é travado; imagem acima de 5 MB dá erro e não envia", async () => {
    const user = userEvent.setup();
    let uploads = 0;
    server.use(http.post("/api/v1/announcements/image", () => (uploads++, HttpResponse.json({ name: "a.png", url: "/a.png" }))));
    setup({ path: "/comunicados/novo?classId=k1" });
    await ready();
    await screen.findByRole("combobox", { name: "Turma" });
    await user.type(screen.getByLabelText("Título"), "Seminário");
    await user.type(screen.getByLabelText("Texto"), "Sábado tem seminário de raspagens com o professor Rafael, aberto a todas as faixas.");
    const preview = screen.getByRole("complementary", { name: "Prévia" });
    expect(within(preview).getByText("Seminário")).toBeInTheDocument();
    expect(within(preview).getByText(/^Sábado tem seminário de raspagens.*…$/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /^Portal/ })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: /^Portal/ })).toBeChecked();
    const big = new File(["x"], "grande.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 5 * 1024 * 1024 + 1 });
    await user.upload(screen.getByLabelText("Imagem (opcional)"), big);
    expect(await screen.findByText("Use uma imagem válida, de até 5 MB.")).toBeInTheDocument();
    expect(uploads).toBe(0);
  });

  it("R14: data de fixação passada mostra o erro no campo", async () => {
    const user = userEvent.setup();
    setup({ path: "/comunicados/novo?classId=k1", create: () => failure(400, "VALIDATION_ERROR", [{ field: "pinnedUntil", message: "x" }]) });
    await ready();
    await screen.findByRole("combobox", { name: "Turma" });
    await user.type(screen.getByLabelText("Título"), "Aviso");
    await user.type(screen.getByLabelText("Texto"), "Texto");
    await user.click(screen.getByRole("button", { name: "Enviar comunicado" }));
    expect(await screen.findByText("Use hoje ou uma data futura.")).toBeInTheDocument();
  });

  describe("no celular (R16, CA14)", () => {
    afterEach(() => setDeviceNarrow(false));
    const mobile = async (create?: () => Response) => {
      setDeviceNarrow(true);
      setup({ path: "/comunicados/novo?classId=k1", create });
      await screen.findByRole("combobox", { name: "Destino" });
    };

    it("é tela cheia: voltar, título, ordem dos campos, Resumo e a barra com Agendar e Enviar", async () => {
      const user = userEvent.setup();
      await mobile();
      expect(screen.getByRole("heading", { name: "Novo comunicado", level: 1 })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Voltar aos comunicados" })).toHaveAttribute("href", "/comunicados");
      expect(screen.getByRole("combobox", { name: "Destino" })).toHaveValue("CLASS:k1");
      expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveValue("GENERAL");
      const order = ["Destino", "Tipo", "Título", "Texto", "Canais"].map((n) => screen.getByText(n, { selector: "legend, label" }));
      order.forEach((el, i) => i > 0 && expect(order[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy());
      expect(screen.getByRole("checkbox", { name: "Abrir o grupo no WhatsApp" })).toBeInTheDocument();
      expect(screen.queryByRole("switch", { name: "Push" })).toBeNull();
      expect(await screen.findByText("Vai para 8 pessoas, 7 por e-mail.")).toBeInTheDocument();
      await user.type(screen.getByLabelText("Título"), "Aviso");
      await user.type(screen.getByLabelText("Texto"), "Texto");
      expect(screen.getByText("5 / 2.000")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Enviar" }));
      expect(await screen.findByText("Comunicado enviado.")).toBeInTheDocument();
      expect(creates).toEqual([{ targetKind: "CLASS", classId: "k1", type: "GENERAL", title: "Aviso", body: "Texto", channels: ["PORTAL"] }]);
    });

    it("Agendar abre a janela de data e hora: sem data ou no passado dá erro; com data futura cria o agendado", async () => {
      const user = userEvent.setup();
      await mobile(() => HttpResponse.json({ id: "n1", status: "SCHEDULED", recipients: null }, { status: 201 }));
      await user.type(screen.getByLabelText("Título"), "Aviso");
      await user.type(screen.getByLabelText("Texto"), "Texto");
      await user.click(screen.getByRole("button", { name: "Agendar" }));
      const dialog = await screen.findByRole("dialog", { name: "Agendar comunicado" });
      const confirm = within(dialog).getByRole("button", { name: "Agendar" });
      await user.click(confirm);
      expect(await within(dialog).findByText("Escolha uma data e hora futuras.")).toBeInTheDocument();
      await user.type(within(dialog).getByLabelText("Data e hora do envio"), "2001-01-01T10:00");
      await user.click(confirm);
      expect(within(dialog).getByText("Escolha uma data e hora futuras.")).toBeInTheDocument();
      expect(creates).toHaveLength(0);
      await user.clear(within(dialog).getByLabelText("Data e hora do envio"));
      await user.type(within(dialog).getByLabelText("Data e hora do envio"), "2099-01-01T10:00");
      await user.click(confirm);
      expect(await screen.findByText("Comunicado agendado.")).toBeInTheDocument();
      expect(creates[0].sendAt).toBe(new Date("2099-01-01T10:00").toISOString());
    });

    it("axe a 360 px nos dois temas", async () => {
      for (const dark of [false, true]) {
        setDeviceNarrow(true, dark);
        window.innerWidth = 360;
        const { unmount } = setup({ path: "/comunicados/novo?classId=k1&type=CANCELED_CLASS&date=2026-11-03&time=19:00" });
        await screen.findByText("Vai para 8 pessoas, 7 por e-mail.");
        expect(await axeViolations(document.body)).toEqual([]);
        unmount();
      }
    });
  });
});
