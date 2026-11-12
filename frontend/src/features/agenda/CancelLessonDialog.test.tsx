import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { CancelLessonDialog } from "./CancelLessonDialog";
import { lessonFixture } from "./lessonFixture";
import type { LessonDetail } from "./useLesson";

let sent: unknown[] = [];
function open(lesson: LessonDetail = lessonFixture(), status = 200) {
  sent = [];
  server.use(
    http.post("/api/v1/agenda/lessons/:id/cancel", async ({ request }) => {
      sent.push(await request.json());
      return status === 200 ? HttpResponse.json(lesson) : HttpResponse.json({ code: "X", fields: [] }, { status });
    }),
  );
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<CancelLessonDialog lesson={lesson} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved, dialog: screen.getByRole("dialog", { name: "Cancelar aula" }) };
}

describe("CancelLessonDialog", () => {
  it("CA1: resumo de uma linha, quatro motivos e botão de cancelar; sem motivo mostra o erro e não chama o servidor", async () => {
    const user = userEvent.setup();
    const { dialog } = open();
    expect(within(dialog).getByText("Jiu-Jitsu Kids · Terça, 10/03/2026 · 19:00–20:00 · Ana Souza · 14 alunos")).toBeInTheDocument();
    for (const m of ["Professor indisponível", "Feriado", "Evento na academia", "Outro"]) expect(within(dialog).getByRole("radio", { name: m })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar aula" }));
    expect(await within(dialog).findByText("Escolha o motivo.")).toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it("CA1: Outro pede o motivo escrito; com motivo válido chama o servidor, fecha e avisa o painel", async () => {
    const user = userEvent.setup();
    const { dialog, onClose, onSaved } = open();
    expect(within(dialog).queryByLabelText(/Escreva o motivo/)).toBeNull();
    await user.click(within(dialog).getByRole("radio", { name: "Outro" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar aula" }));
    expect(await within(dialog).findByText(/Informe o motivo, em até 200/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/Escreva o motivo/), "Chuva forte");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar aula" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(sent).toEqual([{ reason: "OTHER", reasonText: "Chuva forte", channels: [] }]);
  });

  it("CA2: com experimental mostra o aviso e as opções desabilitadas com Em breve", () => {
    const { dialog } = open(lessonFixture({ trialClasses: 1 }));
    expect(within(dialog).getByText("Esta aula tem 1 aula experimental marcada. Decida antes de cancelar.")).toBeInTheDocument();
    for (const n of ["Reagendar", "Cancelar experimental", "Reagendar para"]) expect(within(dialog).getByRole("button", { name: n })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getAllByText("Em breve").length).toBeGreaterThanOrEqual(3);
  });

  it("CA2: sem experimental o aviso não aparece", () => {
    const { dialog } = open();
    expect(within(dialog).queryByText(/aula experimental marcada/)).toBeNull();
  });

  it("CA3: Portal fixo, E-mail e WhatsApp (só com grupo) vão em channels; Push em breve; nota de RN-AGE-05; sem 'chega em breve'", async () => {
    const user = userEvent.setup();
    const { dialog } = open();
    expect(within(dialog).getByRole("checkbox", { name: "Portal" })).toBeDisabled();
    expect(within(dialog).getByRole("switch", { name: "Push" })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByText('Cancelar não avisa ninguém sozinho. Depois, use "Avisar turma" para mandar o aviso já preenchido.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/chega em breve/)).toBeNull();
    await user.click(within(dialog).getByRole("radio", { name: "Feriado" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "E-mail" }));
    await user.click(within(dialog).getByRole("checkbox", { name: "WhatsApp" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar aula" }));
    await vi.waitFor(() => expect(sent).toEqual([{ reason: "HOLIDAY", channels: ["EMAIL", "WHATSAPP"] }]));
  });

  it("CA3: sem grupo não há WhatsApp", () => {
    const { dialog } = open(lessonFixture({ groupLink: null }));
    expect(within(dialog).queryByRole("checkbox", { name: "WhatsApp" })).toBeNull();
  });

  it("CA1: 409 aparece na janela e ela fica aberta; Voltar fecha", async () => {
    const user = userEvent.setup();
    const { dialog, onClose, onSaved } = open(lessonFixture(), 409);
    await user.click(within(dialog).getByRole("radio", { name: "Feriado" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar aula" }));
    expect(await within(dialog).findByText(/já concluída ou cancelada/)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    await user.click(within(dialog).getAllByRole("button", { name: "Voltar" }).at(-1)!);
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: sem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    open(lessonFixture({ trialClasses: 2 }));
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
