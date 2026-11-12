import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { EditLessonDialog } from "./EditLessonDialog";
import { lessonFixture } from "./lessonFixture";
import type { LessonDetail } from "./useLesson";

const teachers = [
  { id: "t1", name: "Ana Souza" },
  { id: "t2", name: "João Pereira" },
];
let sent: unknown[] = [];
function open(lesson: LessonDetail = lessonFixture(), opts: { agenda?: number; put?: number } = {}) {
  sent = [];
  server.use(
    http.get("/api/v1/agenda", () =>
      opts.agenda ? HttpResponse.json({ code: "X" }, { status: opts.agenda }) : HttpResponse.json({ units: [], unit: { id: "u1", name: "Centro" }, teachers, modalities: [], lessons: [], noClassDays: [] }),
    ),
    http.put("/api/v1/agenda/lessons/:id", async ({ request }) => {
      sent.push(await request.json());
      return opts.put ? HttpResponse.json({ code: "X", fields: [] }, { status: opts.put }) : HttpResponse.json(lesson);
    }),
  );
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<EditLessonDialog lesson={lesson} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved, dialog: screen.getByRole("dialog", { name: "Editar aula" }) };
}
const ready = () => screen.findByRole("option", { name: "João Pereira" });

describe("EditLessonDialog", () => {
  it("CA4: cartão Aula, Data/Início/Término, professor com ajuda, Vale para com descrição, observação em breve e Avisar a turma; Salvar aula envia THIS", async () => {
    const user = userEvent.setup();
    const { dialog, onSaved } = open();
    await ready();
    expect(within(dialog).getByText("Jiu-Jitsu · Jiu-Jitsu Kids · Terça · 19:00–20:00 · Centro")).toBeInTheDocument();
    for (const l of ["Data", "Início", "Término"]) expect(within(dialog).getByLabelText(l)).toBeInTheDocument();
    expect(within(dialog).getByText("Pode ser de outra unidade, se ensina Jiu-Jitsu. Ele vê a turma só no dia da aula.")).toBeInTheDocument();
    expect(within(dialog).getByText("A aula fica marcada como alterada à mão e vira substituição")).toBeInTheDocument();
    expect(within(dialog).getByText("Muda as próximas aulas desta turma, sem mexer no titular")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Observação para a equipe (opcional)" })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByText("Abre o comunicado pronto depois de salvar")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Salvar aula" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith({ teacherChanged: false, timeChanged: false, notify: false, date: "2026-03-10", startsAt: "19:00" }));
    expect(sent).toEqual([{ scope: "THIS", date: "2026-03-10", startsAt: "19:00", endsAt: "20:00", teacherId: "t1" }]);
  });

  it("CA4: término antes do início mostra o erro; 409 mostra a mensagem", async () => {
    const user = userEvent.setup();
    const { dialog } = open(lessonFixture(), { put: 409 });
    await ready();
    fireEvent.change(within(dialog).getByLabelText("Término"), { target: { value: "18:00" } });
    await user.click(within(dialog).getByRole("button", { name: "Salvar aula" }));
    expect(await within(dialog).findByText(/o término depois do início/)).toBeInTheDocument();
    expect(sent).toEqual([]);
    fireEvent.change(within(dialog).getByLabelText("Término"), { target: { value: "20:00" } });
    await user.click(within(dialog).getByRole("button", { name: "Salvar aula" }));
    expect(await within(dialog).findByText(/já existe aula da turma neste dia e horário/)).toBeInTheDocument();
  });

  it("CA5: Esta e as seguintes mostra alerta, resumo e Salvar N aulas; Só esta aula esconde tudo", async () => {
    const user = userEvent.setup();
    const { dialog } = open(lessonFixture({ followingEdited: 3, followingCount: 22, followingUntil: "2026-12-03" }));
    await ready();
    expect(within(dialog).queryByText("Resumo")).toBeNull();
    await user.click(within(dialog).getByRole("radio", { name: /Esta e as seguintes/ }));
    expect(within(dialog).getByText("3 aulas já alteradas à mão serão atingidas.")).toBeInTheDocument();
    expect(within(dialog).getByText("Nelas a data e o horário mudam; as que já têm substituto mantêm o substituto.")).toBeInTheDocument();
    expect(within(dialog).getByText("Data e horário das seguintes ficam como estão.")).toBeInTheDocument();
    expect(within(dialog).getByText("Atinge só aulas ainda não iniciadas da turma: 22 aulas até 03/12.")).toBeInTheDocument();
    expect(within(dialog).queryByText(/vira "Substituição"/)).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Data"), { target: { value: "2026-03-11" } });
    expect(within(dialog).getByText("As seguintes se deslocam 1 dia, mantendo o ritmo semanal.")).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText("Professor da aula"), "t2");
    expect(within(dialog).getByText('O titular da turma não muda; a aula vira "Substituição".')).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Salvar 22 aulas" }));
    await vi.waitFor(() => expect(sent).toEqual([{ scope: "FOLLOWING", date: "2026-03-11", startsAt: "19:00", endsAt: "20:00", teacherId: "t2" }]));
  });

  it("CA5: com followingEdited 0 o alerta não aparece e Só esta aula volta a Salvar aula", async () => {
    const user = userEvent.setup();
    const { dialog } = open(lessonFixture({ followingCount: 5, followingUntil: "2026-04-07" }));
    await ready();
    await user.click(within(dialog).getByRole("radio", { name: /Esta e as seguintes/ }));
    expect(within(dialog).queryByText(/já alteradas à mão/)).toBeNull();
    expect(within(dialog).getByRole("button", { name: "Salvar 5 aulas" })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("radio", { name: /Só esta aula/ }));
    expect(within(dialog).getByRole("button", { name: "Salvar aula" })).toBeInTheDocument();
  });

  it("CA4: avulsa não oferece Esta e as seguintes", async () => {
    const { dialog } = open(lessonFixture({ class: null, title: "Seminário" }));
    await ready();
    expect(within(dialog).queryByRole("radio", { name: /Esta e as seguintes/ })).toBeNull();
  });

  it("CA10: troca de professor com Avisar a turma ligado devolve o que mudou", async () => {
    const user = userEvent.setup();
    const { dialog, onSaved } = open();
    await ready();
    await user.selectOptions(within(dialog).getByLabelText("Professor da aula"), "t2");
    await user.click(within(dialog).getByRole("switch", { name: "Avisar a turma" }));
    await user.click(within(dialog).getByRole("button", { name: "Salvar aula" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith({ teacherChanged: true, timeChanged: false, notify: true, date: "2026-03-10", startsAt: "19:00" }));
  });

  it("CA13: erro 500 tem Tentar de novo e 403 mostra sem permissão", async () => {
    const user = userEvent.setup();
    open(lessonFixture(), { agenda: 500 });
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    server.use(http.get("/api/v1/agenda", () => HttpResponse.json({ code: "X" }, { status: 403 })));
    await user.click(retry);
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: sem violações no axe no tema %s", async (_n, dark) => {
    const user = userEvent.setup();
    setDevicePrefersDark(dark);
    const { dialog } = open(lessonFixture({ followingEdited: 1, followingCount: 4, followingUntil: "2026-04-07" }));
    await ready();
    await user.click(within(dialog).getByRole("radio", { name: /Esta e as seguintes/ }));
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
