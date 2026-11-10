import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { RecordHistory } from "./RecordHistory";

const ago = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const entry = (action: string, at: string, actor: string | null = "Carla Mendes", reason: string | null = null) => ({ action, at, actor, actorProfile: actor ? "ADMINISTRATOR" : null, reason });

function serve(items: unknown[] | Response) {
  server.use(http.get("/api/v1/students/:id/history", () => (items instanceof Response ? items : HttpResponse.json({ items, page: 1, size: 100, total: items.length }))));
  render(<RecordHistory id="s1" />);
}
async function pick(user: ReturnType<typeof userEvent.setup>, filter: string, option: string) {
  await user.click(screen.getByRole("button", { name: new RegExp(filter) }));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("ficha do aluno: aba Histórico (RF-ALU-03)", () => {
  it("CA11: filtra por Área e por Período; Sistema sem ator; Ver na auditoria é Em breve", async () => {
    const user = userEvent.setup();
    serve([
      entry("student.updated", ago(5), "Carla Mendes", "telefone novo"),
      entry("charge.reminder_sent", ago(10), null),
      entry("student.created", ago(500)),
    ]);
    expect(await screen.findByText("Dados pessoais alterados")).toBeInTheDocument();
    expect(screen.getByText("Carla Mendes · Administrador")).toBeInTheDocument();
    expect(screen.getByText("Sistema")).toBeInTheDocument();
    expect(screen.getByText("Motivo: telefone novo")).toBeInTheDocument();
    expect(screen.queryByText("Cadastro do aluno")).toBeNull();
    expect(screen.getByText("Ver na auditoria", { selector: "span, a, button" })).toBeInTheDocument();
    await pick(user, "Área", "Financeiro");
    expect(screen.queryByText("Dados pessoais alterados")).toBeNull();
    expect(screen.getByText("charge.reminder_sent")).toBeInTheDocument();
    await pick(user, "Área", "Todas");
    await pick(user, "Período", "Todo o período");
    expect(screen.getByText("Cadastro do aluno")).toBeInTheDocument();
  });

  it("CA12: sem registros, filtro sem resultado, 403 e erro com Tentar de novo", async () => {
    const user = userEvent.setup();
    serve([entry("student.updated", ago(1))]);
    await screen.findByText("Dados pessoais alterados");
    await pick(user, "Área", "Financeiro");
    expect(screen.getByText("Nenhuma ação neste filtro.")).toBeInTheDocument();
  });

  it("CA12: lista vazia", async () => {
    serve([]);
    expect(await screen.findByText("Ainda não há ações registradas para este aluno.")).toBeInTheDocument();
  });

  it("CA12: 403 mostra sem permissão", async () => {
    serve(HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA12: erro mostra Tentar de novo", async () => {
    serve(HttpResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }));
    expect(await screen.findByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  it("pagina no front: 30 registros, 25 por página", async () => {
    const user = userEvent.setup();
    serve(Array.from({ length: 30 }, (_, i) => entry("student.updated", ago(1 + i * 0.01))));
    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(26);
    expect(screen.getByText("1–25 de 30")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(within(table).getAllByRole("row")).toHaveLength(6);
  });
});
