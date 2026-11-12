import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { CorrectTeacherDialog } from "./CorrectTeacherDialog";
import { lessonFixture } from "./lessonFixture";

const teachers = [
  { id: "t1", name: "Ana Souza" },
  { id: "t2", name: "João Pereira" },
];
let sent: unknown[] = [];
function open(opts: { agenda?: number; put?: number } = {}) {
  sent = [];
  const lesson = lessonFixture({ status: "COMPLETED" });
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
  render(<CorrectTeacherDialog lesson={lesson} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved, dialog: screen.getByRole("dialog", { name: "Corrigir professor" }) };
}
const ready = () => screen.findByRole("option", { name: "João Pereira" });

describe("CorrectTeacherDialog", () => {
  it("CA7: subtítulo, seletor, motivo, resumo e nota dos 30 dias, sem data nem hora; motivo vazio recusa; salvar envia reason", async () => {
    const user = userEvent.setup();
    const { dialog, onSaved } = open();
    await ready();
    expect(within(dialog).getByText("Jiu-Jitsu Kids · Terça, 10/03/2026 · concluída")).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Data")).toBeNull();
    expect(within(dialog).queryByLabelText("Início")).toBeNull();
    for (const s of ["Data e horário não mudam.", 'A aula passa a mostrar "Substituição".', "A correção vai para a auditoria com o valor antes e depois.", "Correção só para aulas concluídas nos últimos 30 dias, pelo Administrador ou pelo Coordenador."]) expect(within(dialog).getByText(s)).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText("Professor que deu a aula"), "t2");
    await user.click(within(dialog).getByRole("button", { name: "Salvar correção" }));
    expect(await within(dialog).findByText("Informe o motivo da correção.")).toBeInTheDocument();
    expect(sent).toEqual([]);
    await user.type(within(dialog).getByLabelText(/Motivo/), "Troca registrada");
    await user.click(within(dialog).getByRole("button", { name: "Salvar correção" }));
    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(sent).toEqual([{ scope: "THIS", date: "2026-03-10", startsAt: "19:00", endsAt: "20:00", teacherId: "t2", reason: "Troca registrada" }]);
  });

  it("CA7: fora dos 30 dias o servidor devolve 409 e a janela mostra a mensagem", async () => {
    const user = userEvent.setup();
    const { dialog, onSaved } = open({ put: 409 });
    await ready();
    await user.type(within(dialog).getByLabelText(/Motivo/), "Troca");
    await user.click(within(dialog).getByRole("button", { name: "Salvar correção" }));
    expect(await within(dialog).findByText(/últimos 30 dias. Nada foi alterado/)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("CA13: erro 500 tem Tentar de novo", async () => {
    open({ agenda: 500 });
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("CA13: sem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    open();
    await ready();
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
