import { render, screen } from "@testing-library/react";
import { axeViolations } from "@/test/axe";
import { RecordGraduations } from "./RecordGraduations";

describe("aba Graduações (CA6, D4)", () => {
  it("mostra o texto do canvas e Registrar graduação em breve, sem chamar rota", async () => {
    const { container } = render(<RecordGraduations />);
    expect(screen.getByText(/Registros nunca são apagados/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar graduação" })).toHaveAttribute("aria-disabled", "true");
    expect(await axeViolations(container)).toEqual([]);
  });
});
