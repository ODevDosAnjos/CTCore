import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { ChangePlanDialog } from "./ChangePlanDialog";
import { choiceRoutes, enrollmentOf, modalityRow } from "./enrollmentFixtures";
import type { EnrollmentModality } from "./types";

let bodies: unknown[];
let queries: string[];
const onDone = vi.fn();
const onClose = vi.fn();

function setup(row: EnrollmentModality = modalityRow(), put?: () => Response) {
  bodies = [];
  queries = [];
  onDone.mockClear();
  onClose.mockClear();
  server.use(
    ...choiceRoutes(queries),
    http.put("/api/v1/students/s1/modalities/m1/plan", async ({ request }) => {
      bodies.push(await request.json());
      return put ? put() : HttpResponse.json(enrollmentOf([row]));
    }),
  );
  return render(
    <ThemeProvider>
      <ChangePlanDialog studentId="s1" row={row} onClose={onClose} onDone={onDone} />
    </ThemeProvider>,
  );
}

describe("janela Trocar plano (R10, R25, CA34)", () => {
  it("informa que vale a partir da próxima cobrança, pede os planos da unidade e da modalidade e envia o novo", async () => {
    const user = userEvent.setup();
    setup();
    expect(await screen.findByRole("radio", { name: /Plano Mensal/ })).toBeChecked();
    expect(screen.getByText("3x por semana")).toBeInTheDocument();
    expect(screen.getByText("Livre")).toBeInTheDocument();
    expect(screen.getByText("R$ 220,00")).toBeInTheDocument();
    expect(screen.getByText("Modalidade").nextElementSibling).toHaveTextContent("Jiu-Jitsu");
    expect(queries[0]).toContain("unitId=u1");
    expect(queries[0]).toContain("modalityId=mod1");
    const submit = screen.getByRole("button", { name: "Trocar plano" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: /Plano Trimestral/ }));
    expect(submit).toBeDisabled();
    expect(screen.getByText("Plano atual: Plano Mensal · R$ 180,00")).toBeInTheDocument();
    expect(screen.getByText("Novo plano: Plano Trimestral · R$ 220,00")).toBeInTheDocument();
    expect(screen.getByText(/Vale a partir da próxima cobrança gerada: [a-z]{3}\/\d{4}\. A cobrança de [a-z]{3}\/\d{4} já gerada não muda\./)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Motivo/), "Quer treinar também de manhã");
    await user.click(submit);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(bodies).toEqual([{ planId: "p2", reason: "Quer treinar também de manhã" }]);
    expect(onClose).toHaveBeenCalled();
  });

  it("com plano agendado, voltar ao atual é permitido (limpa o agendamento)", async () => {
    const user = userEvent.setup();
    setup(modalityRow({ nextPlan: { id: "p2", name: "Plano Trimestral" } }));
    expect(await screen.findByRole("radio", { name: /Plano Trimestral/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /Plano Mensal/ }));
    await user.type(screen.getByLabelText(/Motivo/), "Voltou ao plano antigo");
    await user.click(screen.getByRole("button", { name: "Trocar plano" }));
    await waitFor(() => expect(bodies).toEqual([{ planId: "p1", reason: "Voltou ao plano antigo" }]));
  });

  it("mostra o 422 do servidor no campo", async () => {
    const user = userEvent.setup();
    setup(modalityRow(), () => HttpResponse.json({ code: "UNPROCESSABLE", fields: [{ field: "planId", message: "plano inativo" }] }, { status: 422 }));
    await user.click(await screen.findByRole("radio", { name: /Plano Trimestral/ }));
    await user.type(screen.getByLabelText(/Motivo/), "Motivo qualquer");
    await user.click(screen.getByRole("button", { name: "Trocar plano" }));
    expect(await screen.findByText("plano inativo")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("R18: com o plano pedido pelo aluno a janela abre com ele escolhido", async () => {
    server.use(...choiceRoutes());
    render(
      <ThemeProvider>
        <ChangePlanDialog studentId="s1" row={modalityRow()} initial="p2" onClose={onClose} onDone={onDone} />
      </ThemeProvider>,
    );
    expect(await screen.findByRole("radio", { name: /Plano Trimestral/ })).toBeChecked();
  });

  it("falha ao carregar pede nova tentativa", async () => {
    server.use(http.get("/api/v1/plans", () => HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 })));
    render(
      <ThemeProvider>
        <ChangePlanDialog studentId="s1" row={modalityRow()} onClose={onClose} onDone={onDone} />
      </ThemeProvider>,
    );
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    setup();
    await screen.findByRole("radio", { name: /Plano Mensal/ });
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
