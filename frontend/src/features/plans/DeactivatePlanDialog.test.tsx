import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { DeactivatePlanDialog } from "./DeactivatePlanDialog";
import type { PlanRow } from "./usePlans";

const plan = (students: number): PlanRow => ({
  id: "p1",
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  name: "Adulto livre",
  valueCents: 22000,
  weeklyFrequency: null,
  validOtherUnits: true,
  studentsUsing: students,
  status: "ACTIVE",
});

function setup(students = 21, post?: () => Response) {
  const calls: string[] = [];
  const onClose = vi.fn();
  const onDone = vi.fn();
  server.use(
    http.post("/api/v1/plans/p1/deactivate", () => {
      calls.push("deactivate");
      return post ? post() : HttpResponse.json({ ...plan(students), status: "INACTIVE" });
    }),
  );
  const view = render(<DeactivatePlanDialog plan={plan(students)} onClose={onClose} onDone={onDone} />);
  return { calls, onClose, onDone, view };
}

describe("DeactivatePlanDialog (RN-PLA-06)", () => {
  it("CA10: mostra subtítulo, o texto com os alunos, o resumo e o botão de perigo; Cancelar não chama a API", async () => {
    const user = userEvent.setup();
    const { calls, onClose } = setup();
    const d = within(await screen.findByRole("dialog", { name: "Desativar plano" }));
    expect(d.getByText("Jiu-Jitsu · Adulto livre · R$ 220,00")).toBeInTheDocument();
    expect(d.getByText(/Os 21 alunos que já usam continuam com ele até trocar\./)).toBeInTheDocument();
    expect(d.getByText("Resumo")).toBeInTheDocument();
    expect(d.getByText("Nada muda nas cobranças já geradas.")).toBeInTheDocument();
    expect(d.getByText("Plano desativado não é editável: para mudar algo, reative antes.")).toBeInTheDocument();
    expect(d.getByText("Você reativa quando quiser, se não houver outro plano ativo com o mesmo nome.")).toBeInTheDocument();
    await user.click(d.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(calls).toEqual([]);
  });

  it("CA10: com 1 aluno o texto vai ao singular; com 0 não cita alunos", async () => {
    const one = setup(1);
    expect(await screen.findByText(/O aluno que já usa continua com ele até trocar\./)).toBeInTheDocument();
    one.view.unmount();
    setup(0);
    expect(await screen.findByText("O plano some das escolhas de matrícula e de troca de plano.")).toBeInTheDocument();
    expect(screen.queryByText(/continua/)).toBeNull();
  });

  it("CA10: confirmar chama a API, fecha e recarrega", async () => {
    const user = userEvent.setup();
    const { calls, onClose, onDone } = setup();
    await user.click(await screen.findByRole("button", { name: "Desativar plano" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(calls).toEqual(["deactivate"]);
    expect(onClose).toHaveBeenCalled();
  });

  it("CA10: 403 mostra a mensagem de permissão e a janela não fecha", async () => {
    const user = userEvent.setup();
    const { onClose, onDone } = setup(21, () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    await user.click(await screen.findByRole("button", { name: "Desativar plano" }));
    expect(await screen.findByText("Você não tem permissão para isto. Nada foi alterado.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("CA15: sem violações no axe", async () => {
    setup();
    await screen.findByRole("dialog");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
