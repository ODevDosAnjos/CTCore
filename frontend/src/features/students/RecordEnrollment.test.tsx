import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { choiceRoutes, enrollmentOf, modalityRow } from "./enrollmentFixtures";
import { RecordEnrollment } from "./RecordEnrollment";
import type { Enrollment } from "./types";

type Result = Parameters<typeof RecordEnrollment>[0]["enrollment"];
const reload = vi.fn();
const result = (status: Result["status"], data?: Enrollment): Result => ({ status, data, reload });
const show = (enrollment: Result, canGrant = false, path = "/") =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <RecordEnrollment studentId="s1" studentName="Aluno Teste" canGrant={canGrant} enrollment={enrollment} onChanged={() => {}} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe("aba Matrícula e modalidades (R23, R27, CA33)", () => {
  beforeEach(() => reload.mockClear());

  it("carregando, sem permissão e erro com nova tentativa", async () => {
    const user = userEvent.setup();
    const first = show(result("loading"));
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    first.unmount();
    const second = show(result("forbidden"));
    expect(screen.getByText("Você não tem acesso")).toBeInTheDocument();
    second.unmount();
    show(result("error"));
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(reload).toHaveBeenCalled();
  });

  it("RF-BEN-02: Conceder benefício só aparece com permissão de benefícios e abre a janela da modalidade", async () => {
    const user = userEvent.setup();
    const data = enrollmentOf([modalityRow(), modalityRow({ id: "m2", canEdit: false })]);
    const without = show(result("ready", data));
    expect(screen.queryByRole("button", { name: "Conceder benefício" })).toBeNull();
    without.unmount();
    show(result("ready", data), true);
    expect(screen.getAllByRole("button", { name: "Conceder benefício" })).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Conceder benefício" }));
    expect(await screen.findByRole("dialog", { name: "Conceder benefício em Jiu-Jitsu" })).toBeInTheDocument();
  });

  it("sem matrícula mostra o estado vazio explicativo", () => {
    show(result("ready", { id: null, status: "NONE", enrolledAt: null, reopenedAt: null, modalities: [] }));
    expect(screen.getByText("Sem matrícula")).toBeInTheDocument();
    expect(screen.getByText(/nova matrícula/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nova matrícula" })).toHaveAttribute("href", "/alunos/nova-matricula?aluno=s1");
  });

  it("modalidade encerrada aparece sem ações", () => {
    show(result("ready", enrollmentOf([modalityRow({ status: "ENDED", endedAt: "2026-03-01T12:00:00Z" })])));
    expect(screen.getByText("Encerrada")).toBeInTheDocument();
    expect(within(screen.getAllByRole("listitem")[0]).queryByRole("button")).toBeNull();
    // R11: ex-aluno recomeça pelo assistente, já no aluno
    expect(screen.getByRole("link", { name: "Adicionar modalidade" })).toHaveAttribute("href", "/alunos/nova-matricula?aluno=s1");
  });

  it("RF-MAT-03: Encerrar só aparece na modalidade que a pessoa pode alterar, habilitado e sem aviso de em breve, e abre a janela", async () => {
    const user = userEvent.setup();
    show(result("ready", enrollmentOf([modalityRow(), modalityRow({ id: "m2", canEdit: false })])));
    expect(screen.getAllByRole("button", { name: "Encerrar" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Encerrar" })).toBeEnabled();
    expect(screen.queryByText(/em breve/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Encerrar" }));
    expect(await screen.findByRole("dialog", { name: "Encerrar Jiu-Jitsu" })).toBeInTheDocument();
  });

  it("CA1, CA3: linha de limite, Adicionar modalidade, grade, ordem dos botões e Encerrar em contorno vermelho", () => {
    show(result("ready", enrollmentOf([modalityRow(), modalityRow({ id: "m2" }), modalityRow({ id: "m3" })])), true);
    expect(screen.getByText("Uma matrícula na organização · até 10 modalidades ativas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Adicionar modalidade" })).toHaveAttribute("href", "/alunos/nova-matricula?aluno=s1");
    const card = screen.getAllByRole("listitem")[0];
    for (const l of ["Unidade", "Turma principal", "Outros horários", "Plano", "Vencimento"]) expect(within(card).getByText(l)).toBeInTheDocument();
    expect(within(card).getAllByRole("button").map((b) => b.textContent)).toEqual(["Trocar turma", "Trocar plano", "Conceder benefício", "Transferir", "Encerrar"]);
    expect(within(card).getByRole("button", { name: "Encerrar" }).className).toMatch(/danger/);
  });

  it("CA1: com 10 modalidades ativas o botão fica desabilitado", () => {
    show(result("ready", enrollmentOf(Array.from({ length: 10 }, (_, i) => modalityRow({ id: "m" + i })))));
    expect(screen.queryByRole("link", { name: "Adicionar modalidade" })).toBeNull();
    expect(screen.getByRole("button", { name: "Adicionar modalidade" })).toBeDisabled();
  });

  it("CA2: quem só lê não vê Adicionar modalidade nem botões de troca", () => {
    show(result("ready", enrollmentOf([modalityRow({ canEdit: false })])));
    expect(screen.queryByText("Adicionar modalidade")).toBeNull();
    expect(screen.queryByRole("button", { name: "Trocar turma" })).toBeNull();
  });

  it("CA5: Situação do aluno traz Inativar, Reativar e Cancelar cobranças acumuladas em breve, sem pedido", async () => {
    const user = userEvent.setup();
    show(result("ready", enrollmentOf([modalityRow()])));
    for (const n of ["Inativar", "Reativar", "Cancelar cobranças acumuladas"]) {
      const b = screen.getByRole("button", { name: n });
      expect(b).toHaveAttribute("aria-disabled", "true");
      await user.click(b);
    }
    expect(screen.getByText("Situação do aluno")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("RN-MAT-18: a modalidade com pedido de encerramento aberto traz o selo Encerramento solicitado e segue ativa", () => {
    show(result("ready", enrollmentOf([modalityRow({ closureRequestedAt: "2026-10-20T15:00:00Z" }), modalityRow({ id: "m2" })])));
    expect(screen.getAllByText("Encerramento solicitado")).toHaveLength(1);
    expect(screen.getAllByText("Ativa")).toHaveLength(2);
  });

  it.each([
    ["CLASS_CHANGE", { targetClassId: "k3", targetPlanId: null }, "Trocar turma", "Nova turma principal", "k3"],
    ["PLAN_CHANGE", { targetClassId: null, targetPlanId: "p2" }, "Trocar plano", "Plano novo", "p2"],
  ])("R18: a ficha com ?pedido= de %s abre a troca já preenchida com o que o aluno pediu", async (kind, target, title, field, value) => {
    server.use(
      ...choiceRoutes(),
      http.get("/api/v1/portal-requests/r1", () => HttpResponse.json({ id: "r1", kind, status: "APPROVED", studentId: "s1", modalityRowId: "m1", ...target })),
    );
    show(result("ready", enrollmentOf([modalityRow()])), false, "/alunos/s1?pedido=r1");
    const dialog = await screen.findByRole("dialog", { name: title });
    if (kind === "CLASS_CHANGE") expect(await within(dialog).findByLabelText(field)).toHaveValue(value);
    else expect(await within(dialog).findByRole("radio", { name: /Plano Trimestral/ })).toBeChecked();
  });

  it("R18: pedido de outro aluno ou que não carrega não abre janela", async () => {
    server.use(http.get("/api/v1/portal-requests/r1", () => HttpResponse.json({ id: "r1", kind: "CLASS_CHANGE", studentId: "outro", modalityRowId: "m1", targetClassId: "k3" })));
    show(result("ready", enrollmentOf([modalityRow()])), false, "/alunos/s1?pedido=r1");
    await screen.findByText("Jiu-Jitsu");
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("a 360 px não tem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = show(result("ready", enrollmentOf([modalityRow({ nextPlan: { id: "p2", name: "Plano Trimestral" } }), modalityRow({ id: "m2", canEdit: false })])));
    expect(await axeViolations(container)).toEqual([]);
  });
});
