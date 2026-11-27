import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { UnitTeacherTab } from "./UnitTeacherTab";
import { renderTab } from "./unitTabKit";

const tab = (p: Parameters<typeof renderTab>[0] extends (x: infer P) => unknown ? P : never) => <UnitTeacherTab d={p.d} set={p.set} unitId="u1" unitName="Tijuca" />;

describe("UnitTeacherTab (R6)", () => {
  it("CA15: mostra o título com a unidade, os cinco interruptores com as descrições e a faixa do cadeado", () => {
    renderTab(tab);
    expect(screen.getByRole("heading", { name: "O que os Professores da Tijuca podem fazer", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(5);
    expect(screen.getByText("Só para as turmas dele")).toBeInTheDocument();
    expect(screen.getByText("Das turmas dele ou em que é substituto")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Ver ficha do aluno" })).not.toBeChecked();
    expect(screen.getByText(/Em qualquer caso, o Professor nunca vê valores, plano, benefício, CPF, endereço nem situação financeira/)).toBeInTheDocument();
  });

  it("CA11: o atalho Ver tabela de permissões abre a tabela da unidade", () => {
    renderTab(tab);
    expect(screen.getByRole("link", { name: "Ver tabela de permissões" })).toHaveAttribute("href", "/configuracoes/unidades/u1/permissoes");
  });

  it("CA15: cada interruptor grava a sua permissão no rascunho", async () => {
    const user = userEvent.setup();
    const { draft } = renderTab(tab);
    await user.click(screen.getByRole("switch", { name: "Enviar comunicado" }));
    await user.click(screen.getByRole("switch", { name: "Ver contatos" }));
    await user.click(screen.getByRole("switch", { name: "Ver aulas experimentais" }));
    await user.click(screen.getByRole("switch", { name: "Ver ficha do aluno" }));
    await user.click(screen.getByRole("switch", { name: "Editar e cancelar aulas" }));
    expect(draft().teacher).toEqual({ announcements: false, agendaEdit: false, studentContacts: false, trialClasses: false, studentRecord: true });
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("não tem violações no axe a 360 px no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    window.innerWidth = 360;
    const { container } = renderTab(tab);
    expect(await axeViolations(container)).toEqual([]);
  });
});
