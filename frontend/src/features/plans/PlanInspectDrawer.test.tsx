import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { PlanInspectDrawer } from "./PlanInspectDrawer";
import type { PlanDetail, PlanRow } from "./usePlans";

const plan: PlanRow = {
  id: "p5",
  unit: { id: "u1", name: "Tijuca" },
  modality: { id: "m1", name: "Jiu-Jitsu" },
  name: "Adulto 2x (antigo)",
  valueCents: 15000,
  weeklyFrequency: 2,
  validOtherUnits: false,
  studentsUsing: 3,
  status: "INACTIVE",
};
const detail: PlanDetail = {
  ...plan,
  lastChange: null,
  deactivation: { at: "2026-08-01T15:00:00Z", by: "Carla Mendes" },
  valueHistory: [
    { startsOn: "2025-03-01", valueCents: 15000, changedBy: "Carla Mendes" },
    { startsOn: "2024-01-01", valueCents: 13000, changedBy: null },
  ],
};

function setup(opts: { get?: () => Response; activate?: () => Response; showOtherUnits?: boolean } = {}) {
  const activated: string[] = [];
  const onClose = vi.fn();
  const onDone = vi.fn();
  server.use(
    http.get("/api/v1/plans/p5", () => (opts.get ? opts.get() : HttpResponse.json(detail))),
    http.post("/api/v1/plans/p5/activate", () => {
      activated.push("p5");
      return opts.activate ? opts.activate() : HttpResponse.json({ ...plan, status: "ACTIVE" });
    }),
  );
  render(<PlanInspectDrawer plan={plan} showOtherUnits={opts.showOtherUnits ?? true} onClose={onClose} onDone={onDone} />);
  return { activated, onClose, onDone };
}

describe("PlanInspectDrawer (RN-PLA-06)", () => {
  it("CA11: chip, aviso de só consulta, alunos, quem desativou, Vale em outras unidades e o histórico do mais novo para o mais antigo; sem campo editável", async () => {
    setup();
    const d = within(await screen.findByRole("dialog", { name: "Adulto 2x (antigo)" }));
    expect(d.getByText("Desativado")).toBeInTheDocument();
    expect(d.getByText("Tijuca · R$ 150,00 · 2x por semana")).toBeInTheDocument();
    expect(d.getByText("Plano desativado: só consulta. Reative para editar ou voltar a oferecer.")).toBeInTheDocument();
    expect(await d.findByText("Desativado em 01/08/2026 por Carla Mendes")).toBeInTheDocument();
    expect(d.getByText("Alunos que ainda usam").nextSibling).toHaveTextContent("3");
    expect(d.getByText("Vale em outras unidades").nextSibling).toHaveTextContent("Não");
    const rows = d.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("01/03/2025R$ 150,00Carla Mendes");
    expect(rows[1]).toHaveTextContent("01/01/2024R$ 130,00—");
    expect(d.getByText("A unidade e a modalidade de um plano não mudam: para outra, crie um plano novo.")).toBeInTheDocument();
    expect(d.queryByRole("textbox")).toBeNull();
  });

  it("CA11: sem a política Depende do plano a linha Vale em outras unidades não aparece", async () => {
    setup({ showOtherUnits: false });
    await screen.findByText("Desativado em 01/08/2026 por Carla Mendes");
    expect(screen.queryByText("Vale em outras unidades")).toBeNull();
  });

  it("CA12: Reativar plano chama a API, fecha e recarrega", async () => {
    const user = userEvent.setup();
    const { activated, onClose, onDone } = setup();
    await screen.findByText("Desativado em 01/08/2026 por Carla Mendes");
    await user.click(screen.getByRole("button", { name: "Reativar plano" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(activated).toEqual(["p5"]);
    expect(onClose).toHaveBeenCalled();
  });

  it("CA12: 409 mostra o conflito na gaveta e nada fecha", async () => {
    const user = userEvent.setup();
    const { onClose, onDone } = setup({ activate: () => HttpResponse.json({ code: "CONFLICT" }, { status: 409 }) });
    await screen.findByText("Desativado em 01/08/2026 por Carla Mendes");
    await user.click(screen.getByRole("button", { name: "Reativar plano" }));
    expect(await screen.findByText(/Já existe um plano ativo com este nome/)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("CA15: erro com Tentar de novo e sem permissão; Reativar fica desabilitado enquanto não carrega", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup({ get: () => (fail ? HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }) : HttpResponse.json(detail)) });
    expect(await screen.findByRole("button", { name: "Reativar plano" })).toBeDisabled();
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Desativado em 01/08/2026 por Carla Mendes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reativar plano" })).toBeEnabled();
  });

  it("CA15: 403 mostra sem permissão", async () => {
    setup({ get: () => HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }) });
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA15: sem violações no axe", async () => {
    setup();
    await screen.findByText("Desativado em 01/08/2026 por Carla Mendes");
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
