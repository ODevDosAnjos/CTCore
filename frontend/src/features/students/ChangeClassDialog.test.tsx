import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ChangeClassDialog } from "./ChangeClassDialog";
import { choiceRoutes, enrollmentOf, modalityRow } from "./enrollmentFixtures";

let bodies: unknown[];
const onDone = vi.fn();
const onClose = vi.fn();

const dialog = () => (
  <ThemeProvider>
    <ChangeClassDialog studentId="s1" row={modalityRow()} onClose={onClose} onDone={onDone} />
  </ThemeProvider>
);

function setup(put?: () => Response) {
  bodies = [];
  onDone.mockClear();
  onClose.mockClear();
  server.use(
    ...choiceRoutes(),
    http.put("/api/v1/students/s1/modalities/m1/class", async ({ request }) => {
      bodies.push(await request.json());
      return put ? put() : HttpResponse.json(enrollmentOf([modalityRow()]));
    }),
  );
  return render(dialog());
}

describe("janela Trocar turma (R9, R25, CA34, CA5 da #468)", () => {
  it("o motivo curto (menos de 3 caracteres) mantém o botão desabilitado; sem motivo não envia reason", async () => {
    const user = userEvent.setup();
    setup();
    await user.selectOptions(await screen.findByLabelText("Nova turma principal"), "k3");
    const submit = screen.getByRole("button", { name: "Trocar turma" });
    expect(submit).toBeEnabled();
    await user.type(screen.getByLabelText("Motivo (opcional)"), "ab");
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText("Motivo (opcional)"));
    await user.click(submit);
    await waitFor(() => expect(bodies).toEqual([{ primaryClassId: "k3", otherClassIds: ["k2"] }]));
  });

  it("avisa que vale na hora, envia a turma e os outros horários e fecha com atualização", async () => {
    const user = userEvent.setup();
    setup();
    expect(await screen.findByText("A troca vale agora: o aluno aparece na nova turma a partir da próxima aula.")).toBeInTheDocument();
    expect(screen.getByText("Plano e mensalidade não mudam.")).toBeInTheDocument();
    expect(screen.getByText("Turma principal atual").nextElementSibling).toHaveTextContent("Turma Manhã");
    const submit = screen.getByRole("button", { name: "Trocar turma" });
    expect(submit).toBeDisabled();
    expect(screen.getByRole("option", { name: "Turma Tarde (Qua 15h) · 18 de 25" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Turma Manhã/ })).toBeNull();
    expect(screen.getByText("O aluno pode treinar também nesses horários")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Nova turma principal"), "k3");
    await user.click(screen.getByRole("checkbox", { name: "Turma Manhã" }));
    await user.click(screen.getByRole("checkbox", { name: "Turma Noite" }));
    await user.type(screen.getByLabelText("Motivo (opcional)"), "Mudou o horário de trabalho");
    await user.click(submit);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(bodies).toEqual([{ primaryClassId: "k3", otherClassIds: ["k1"], reason: "Mudou o horário de trabalho" }]);
    expect(onClose).toHaveBeenCalled();
  });

  it("R18: com a turma pedida pelo aluno a janela abre com ela escolhida", async () => {
    render(
      <ThemeProvider>
        <ChangeClassDialog studentId="s1" row={modalityRow()} initial="k3" onClose={onClose} onDone={onDone} />
      </ThemeProvider>,
    );
    server.use(...choiceRoutes());
    expect(await screen.findByLabelText("Nova turma principal")).toHaveValue("k3");
  });

  it("mostra o 422 do servidor no campo e não fecha", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json({ code: "UNPROCESSABLE", fields: [{ field: "primaryClassId", message: "turma inativa" }] }, { status: 422 }));
    await user.selectOptions(await screen.findByLabelText("Nova turma principal"), "k3");
    await user.click(screen.getByRole("button", { name: "Trocar turma" }));
    expect(await screen.findByText("turma inativa")).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("403 do servidor aparece no alto, sem fechar", async () => {
    const user = userEvent.setup();
    setup(() => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    await user.selectOptions(await screen.findByLabelText("Nova turma principal"), "k3");
    await user.click(screen.getByRole("button", { name: "Trocar turma" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Você não tem permissão para alterar esta modalidade.");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("falha ao carregar as turmas pede nova tentativa; 403 mostra o estado sem permissão", async () => {
    server.use(http.get("/api/v1/classes", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    const first = render(dialog());
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
    first.unmount();
    server.use(http.get("/api/v1/classes", () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 })));
    render(dialog());
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup();
    await screen.findByLabelText("Nova turma principal");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
