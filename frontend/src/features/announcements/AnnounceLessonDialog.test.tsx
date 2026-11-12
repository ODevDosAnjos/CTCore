import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router";
import "@/i18n";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AnnounceLessonDialog, type LessonNotice } from "./AnnounceLessonDialog";
import type { AnnouncementDraft } from "./types";

const templates = {
  CANCELED_CLASS: { title: "Aula cancelada", body: "A aula de {turma} do dia {data}, às {horario}, foi cancelada." },
  TEACHER_CHANGE: { title: "Troca de professor", body: "A aula de {turma} terá outro professor em {data}." },
  SCHEDULE_CHANGE: { title: "Mudança de horário", body: "A aula de {turma} muda para {horario}." },
  NO_CLASS_DAY: { title: "Dia sem aula", body: "Não haverá aula em {periodo}: {motivo}." },
  GENERAL: { title: "Aviso geral", body: "" },
};
const notice = (over: Partial<LessonNotice> = {}): LessonNotice => ({
  target: { kind: "CLASS", classId: "c1", name: "Jiu-Jitsu Kids", hasGroup: true },
  date: "2026-03-12",
  time: "19:00",
  cancelled: true,
  type: "CANCELED_CLASS",
  ...over,
});

let creates: AnnouncementDraft[];
let previews: AnnouncementDraft[];
const failure = (status: number, code: string) => HttpResponse.json({ code, message: "m", fields: [], traceId: "t" }, { status });

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}
function open(n: LessonNotice | null = notice(), create?: () => Response) {
  creates = [];
  previews = [];
  server.use(
    http.get("/api/v1/announcements/templates", () => HttpResponse.json({ templates })),
    http.post("/api/v1/announcements/preview", async ({ request }) => {
      const draft = (await request.json()) as AnnouncementDraft;
      previews.push(draft);
      return HttpResponse.json({ recipients: 12, portal: 12, email: 10, whatsapp: draft.channels.includes("WHATSAPP") ? { mode: "GROUP", groupLink: "https://chat.example.com/jj" } : null, channels: draft.channels });
    }),
    http.post("/api/v1/announcements", async ({ request }) => {
      creates.push((await request.json()) as AnnouncementDraft);
      return create?.() ?? HttpResponse.json({ id: "n1", status: "SENT", recipients: 12 }, { status: 201 });
    }),
  );
  const onClose = vi.fn();
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/agenda"]}>
        <AnnounceLessonDialog notice={n} onClose={onClose} />
        <Where />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return { onClose };
}
const ready = () => screen.findByLabelText("Destino");
const dialog = () => screen.getByRole("dialog", { name: "Avisar turma" });

describe("AnnounceLessonDialog", () => {
  it("CA8: aula cancelada abre preenchida, com destino, contador, canais, resumo e nota; Enviar agora não leva sendAt", async () => {
    const user = userEvent.setup();
    open();
    await ready();
    const d = dialog();
    expect(within(d).getByText("Aberto a partir da aula cancelada de Quinta, 12/03")).toBeInTheDocument();
    expect(within(d).getByLabelText("Tipo")).toHaveValue("CANCELED_CLASS");
    expect(within(d).getByLabelText("Destino")).toHaveValue("Turma Jiu-Jitsu Kids");
    expect(within(d).getByLabelText("Texto")).toHaveValue("A aula de Jiu-Jitsu Kids do dia 12/03/2026, às 19:00, foi cancelada.");
    expect(within(d).getByText("68 / 2.000")).toBeInTheDocument();
    expect(within(d).getByRole("checkbox", { name: "Portal do aluno (sempre)" })).toBeDisabled();
    expect(within(d).getByRole("checkbox", { name: "Abrir o grupo no WhatsApp" })).toBeInTheDocument();
    expect(await within(d).findByText("Vai para 12 pessoas (12 no portal), 10 por e-mail.")).toBeInTheDocument();
    expect(within(d).getByText("Cancelar a aula não envia aviso sozinho: o aviso sai por aqui.")).toBeInTheDocument();
    await user.click(within(d).getByRole("checkbox", { name: "E-mail" }));
    await user.click(within(d).getByRole("button", { name: "Enviar agora" }));
    await vi.waitFor(() => expect(creates).toHaveLength(1));
    expect(creates[0]).toMatchObject({ targetKind: "CLASS", classId: "c1", type: "CANCELED_CLASS", title: "Aula cancelada", channels: ["PORTAL", "EMAIL"] });
    expect(creates[0].sendAt).toBeUndefined();
    await vi.waitFor(() => expect(screen.getByTestId("where")).toHaveTextContent("/comunicados"));
  });

  it("CA8: Agendar mostra data e hora e envia com sendAt", async () => {
    const user = userEvent.setup();
    open();
    await ready();
    const d = dialog();
    await user.click(within(d).getByRole("button", { name: "Agendar" }));
    const confirm = within(d).getByRole("button", { name: "Confirmar agendamento" });
    expect(confirm).toBeDisabled();
    await user.type(within(d).getByLabelText("Data e hora do envio"), "2099-01-02T08:30");
    await user.click(confirm);
    await vi.waitFor(() => expect(creates).toHaveLength(1));
    expect(creates[0].sendAt).toMatch(/^2099-01-0[12]T/);
  });

  it("CA8: trocar o tipo com texto editado pergunta antes de substituir", async () => {
    const user = userEvent.setup();
    open();
    await ready();
    const d = dialog();
    await user.type(within(d).getByLabelText("Título"), "!");
    await user.selectOptions(within(d).getByLabelText("Tipo"), "GENERAL");
    expect(within(d).getByRole("alert")).toHaveTextContent("substitui o título e o texto que você escreveu");
    await user.click(within(d).getByRole("button", { name: "Manter meu texto" }));
    expect(within(d).getByLabelText("Título")).toHaveValue("Aula cancelada!");
    await user.selectOptions(within(d).getByLabelText("Tipo"), "GENERAL");
    await user.click(within(d).getByRole("button", { name: "Trocar o texto" }));
    expect(within(d).getByLabelText("Título")).toHaveValue("Aviso geral");
  });

  it("CA9: aula não cancelada sem grupo, de unidade: sem WhatsApp, sem a nota e com destino Unidade", async () => {
    open(notice({ cancelled: false, type: "GENERAL", target: { kind: "UNIT", unitId: "u1", name: "Centro" } }));
    await ready();
    const d = dialog();
    expect(within(d).getByText("Aberto a partir da aula Quinta, 12/03")).toBeInTheDocument();
    expect(within(d).getByLabelText("Destino")).toHaveValue("Unidade Centro");
    expect(within(d).queryByRole("checkbox", { name: "Abrir o grupo no WhatsApp" })).not.toBeInTheDocument();
    expect(await within(d).findByText(/Vai para 12 pessoas/)).toBeInTheDocument();
    expect(within(d).queryByText(/não envia aviso sozinho/)).not.toBeInTheDocument();
    expect(previews[0]).toMatchObject({ targetKind: "UNIT", unitId: "u1" });
  });

  it("CA8: limite diário, 403 e 400 mostram a mensagem da página", async () => {
    const user = userEvent.setup();
    let next = () => failure(409, "ANNOUNCEMENT_DAILY_LIMIT");
    open(notice(), () => next());
    await ready();
    const d = dialog();
    await user.click(within(d).getByRole("button", { name: "Enviar agora" }));
    expect(await within(d).findByText(/limite de 20 comunicados por dia/)).toBeInTheDocument();
    next = () => failure(403, "FORBIDDEN");
    await user.click(within(d).getByRole("button", { name: "Enviar agora" }));
    expect(await within(d).findByText("Você não pode enviar comunicado para este destino.")).toBeInTheDocument();
    next = () => failure(400, "VALIDATION");
    await user.click(within(d).getByRole("button", { name: "Enviar agora" }));
    expect(await within(d).findByText("Confira os dados do comunicado.")).toBeInTheDocument();
  });

  it("CA13: erro nos modelos tem Tentar de novo e 403 mostra sem permissão", async () => {
    const user = userEvent.setup();
    open();
    server.use(http.get("/api/v1/announcements/templates", () => failure(500, "X")));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    server.use(http.get("/api/v1/announcements/templates", () => failure(403, "FORBIDDEN")));
    await user.click(retry);
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([false, true])("CA13: sem violação de acessibilidade (tema escuro: %s)", async (dark) => {
    setDevicePrefersDark(dark);
    open();
    await ready();
    expect(await axeViolations(dialog())).toEqual([]);
  });
});
