import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { RulesCard } from "./RulesCard";
import { toDraft, type RulesDraft } from "./rulesDraft";

const base = toDraft({ deactivationDays: 30, formerStudentRetentionMonths: 12, trialRetentionMonths: 6, crossUnitTraining: "plan" });

function Harness({ canEdit = true, onChange }: { canEdit?: boolean; onChange?: (d: RulesDraft) => void }) {
  const [draft, setDraft] = useState(base);
  return (
    <RulesCard
      draft={draft}
      canEdit={canEdit}
      errors={{}}
      onChange={(d) => {
        setDraft(d);
        onChange?.(d);
      }}
    />
  );
}

describe("RulesCard (R5, R6, RN-ORG-13)", () => {
  it("mostra as quatro regras com unidades e dicas, sem limite de experimentais nem comprovante (RN-AEX-02, RF-MOD-02)", () => {
    render(<Harness />);
    expect(screen.getByLabelText("Prazo para bloquear por atraso")).toHaveValue("30");
    expect(screen.getByText("15 a 90 dias")).toBeInTheDocument();
    expect(screen.getByLabelText("Acesso de ex-aluno ao histórico")).toHaveValue("12");
    expect(screen.getByLabelText("Guardar aulas experimentais sem matrícula")).toHaveValue("6");
    expect(screen.getByText("Depois, os dados são anonimizados")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Experimentais por telefone|Limite de aulas experimentais/)).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((r) => r.closest("label")!.textContent)).toEqual(["Sim", "Não", "Depende do plano"]);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText(/comprovante|Pode ser ligado por modalidade/)).not.toBeInTheDocument();
  });

  it("digitar, escolher e marcar devolvem o rascunho com texto nos números e o valor técnico do treino em outra unidade", async () => {
    const user = userEvent.setup();
    const seen: RulesDraft[] = [];
    render(<Harness onChange={(d) => seen.push(d)} />);
    await user.clear(screen.getByLabelText("Prazo para bloquear por atraso"));
    await user.type(screen.getByLabelText("Prazo para bloquear por atraso"), "45");
    await user.click(screen.getByRole("radio", { name: "Sim" }));
    expect(seen.at(-1)).toEqual({ ...base, deactivationDays: "45", crossUnitTraining: "allowed" });
    await user.click(screen.getByRole("radio", { name: "Não" }));
    expect(seen.at(-1)?.crossUnitTraining).toBe("denied");
  });

  it("somente leitura: tudo desabilitado", () => {
    render(<Harness canEdit={false} />);
    for (const label of ["Prazo para bloquear por atraso", "Acesso de ex-aluno ao histórico", "Guardar aulas experimentais sem matrícula"]) expect(screen.getByLabelText(label)).toBeDisabled();
    for (const r of screen.getAllByRole("radio")) expect(r).toBeDisabled();
  });
});
