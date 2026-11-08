import { render, screen } from "@testing-library/react";
import { GraduationBelt } from "./graduation-belt";
import { axeViolations } from "@/test/axe";

describe("GraduationBelt", () => {
  it("CA1: graus, ponta e aria-label", () => {
    render(<GraduationBelt name="Preta" color="#000000" secondaryColor="#ff0000" degree={2} />);
    expect(screen.getByRole("img", { name: "Faixa Preta, 2 grau(s)" })).toBeInTheDocument();
    expect(screen.getAllByTestId("belt-stripe")).toHaveLength(2);
    expect(screen.getByTestId("belt-tip")).toBeInTheDocument();
  });
  it("CA1: sem grau nem cor secundária não há riscos nem ponta", () => {
    render(<GraduationBelt name="Azul" color="#0000ff" degree={0} />);
    expect(screen.queryByTestId("belt-stripe")).toBeNull();
    expect(screen.queryByTestId("belt-tip")).toBeNull();
  });
  it("CA2: rótulo opcional", () => {
    const { rerender } = render(<GraduationBelt name="Preta" color="#000" degree={1} label="Faixa preta · 1 grau" />);
    expect(screen.getByText("Faixa preta · 1 grau")).toBeInTheDocument();
    rerender(<GraduationBelt name="Preta" color="#000" degree={1} />);
    expect(screen.queryByText("Faixa preta · 1 grau")).toBeNull();
  });
  it.each(["light", "dark"])("CA8: axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    const { container } = render(<GraduationBelt name="Preta" color="#000" secondaryColor="#f00" degree={2} label="Faixa preta" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
