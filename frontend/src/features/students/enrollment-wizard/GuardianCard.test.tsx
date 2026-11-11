import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GuardianCard } from "./GuardianCard";
import { newGuardian } from "./types";

describe("GuardianCard", () => {
  it("mostra o CPF mascarado, avisa os erros e remove o segundo responsável", async () => {
    const onRemove = vi.fn();
    render(<GuardianCard index={1} value={{ ...newGuardian(false), name: "Pai Fictício", cpf: "52998224725" }} errors={{ guardian1Name: "Erro do nome" }} alone={false} onChange={() => undefined} onFinancial={() => undefined} onRemove={onRemove} />);
    expect(screen.getByText("CPF ***.982.***-25")).toBeInTheDocument();
    expect(screen.getByText("Erro do nome")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Responsável financeira" })).toBeEnabled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Remover responsável" }));
    expect(onRemove).toHaveBeenCalled();
  });

  it("sozinho, o responsável é sempre o financeiro e não tem remoção", () => {
    render(<GuardianCard index={0} value={newGuardian(true)} errors={{}} alone onChange={() => undefined} onFinancial={() => undefined} />);
    expect(screen.getByRole("checkbox", { name: "Responsável financeira" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Remover responsável" })).toBeNull();
  });
});
