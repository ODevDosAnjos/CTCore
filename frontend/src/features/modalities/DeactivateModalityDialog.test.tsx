import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { DeactivateModalityDialog, type Blocker } from "./DeactivateModalityDialog";

const ui = (blocker: Blocker | null, onClose = () => undefined) => (
  <ThemeProvider>
    <DeactivateModalityDialog blocker={blocker} onClose={onClose} />
  </ThemeProvider>
);

describe("DeactivateModalityDialog (RN-MOD-06)", () => {
  it("fechada sem impedimento", () => {
    render(ui(null));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("CA5: agrupa as turmas por unidade, mostra os alunos e a orientação, sem '(s)'", async () => {
    const blocker: Blocker = {
      name: "Muay Thai",
      classes: ["Muay Thai Adulto · Noite (Tijuca)", "Muay Thai Iniciante (Barra)", "Muay Thai Avançado (Barra)"],
      students: 63,
    };
    render(ui(blocker));
    const dialog = await screen.findByRole("dialog", { name: "Desativar modalidade" });
    expect(screen.getByRole("alert")).toHaveTextContent("Não dá para desativar o Muay Thai agora");
    expect(dialog).toHaveTextContent("3 turmas ativas: Muay Thai Adulto · Noite (Tijuca), Muay Thai Iniciante e Muay Thai Avançado (Barra)");
    expect(dialog).toHaveTextContent("63 alunos com Muay Thai ativo");
    expect(dialog).toHaveTextContent("As marcações das unidades ficam guardadas e voltam se a modalidade for reativada.");
    expect(dialog.textContent).not.toContain("(s)");
    expect(await axeViolations(document.body)).toEqual([]);
  });

  it("CA5: singular, e só a linha que impede aparece", async () => {
    render(ui({ name: "Boxe", classes: ["Boxe Livre (Tijuca)"], students: 0 }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("1 turma ativa: Boxe Livre (Tijuca)");
    expect(dialog.textContent).not.toMatch(/aluno/);
  });

  it("só alunos: uma linha no singular; 'Entendi' chama onClose", async () => {
    const onClose = vi.fn();
    render(ui({ name: "Boxe", classes: [], students: 1 }, onClose));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("1 aluno com Boxe ativo");
    expect(dialog.textContent).not.toMatch(/turma ativa/);
    await userEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(onClose).toHaveBeenCalled();
  });
});
