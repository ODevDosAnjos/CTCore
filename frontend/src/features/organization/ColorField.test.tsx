import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axeViolations } from "@/test/axe";
import { ColorField } from "./ColorField";
import { contrastRatio } from "./contrastRatio";

function Harness({ start = "", disabled = false, onChange }: { start?: string; disabled?: boolean; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(start);
  return (
    <ColorField
      value={value}
      disabled={disabled}
      onChange={(v) => {
        setValue(v);
        onChange?.(v);
      }}
    />
  );
}
const field = () => screen.getByLabelText("Cor principal");

describe("ColorField (R3, R4, RNF-22)", () => {
  it("CA3: as cinco amostras preenchem o campo; a prévia mostra Pagar R$ 180,90 e o selo de contraste com vírgula", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getAllByRole("button", { name: /^Usar a cor / })).toHaveLength(5);
    for (const hex of ["#C8462C", "#23427A", "#1D5E34", "#6B3FA0", "#1B1B1F"]) {
      await user.click(screen.getByRole("button", { name: `Usar a cor ${hex}` }));
      expect(field()).toHaveValue(hex);
      expect(screen.getByRole("button", { name: `Usar a cor ${hex}` })).toHaveAttribute("aria-pressed", "true");
    }
    await user.click(screen.getByRole("button", { name: "Usar a cor #C8462C" }));
    expect(screen.getByText("Pagar R$ 180,90")).toBeInTheDocument();
    const badge = screen.getByText(/^Contraste 4,\d+:1 · AA$/);
    expect(badge.textContent).toBe(`Contraste ${String(Math.round(contrastRatio("#C8462C") * 100) / 100).replace(".", ",")}:1 · AA`);
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("CA3: campo vazio mostra a cor padrão da plataforma e a prévia sem selo", () => {
    render(<Harness />);
    expect(screen.getByText("Sem cor definida: vale a cor padrão da plataforma.")).toBeInTheDocument();
    expect(screen.getByText("Pagar R$ 180,90")).toBeInTheDocument();
    expect(screen.queryByText(/· AA/)).not.toBeInTheDocument();
  });

  it("CA4: #F5E663 mostra o alerta com 1,28, a prévia ilegível e a sugestão com 4,5:1 ou mais; clicar nela aplica", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    render(<Harness start="#F5E663" onChange={(v) => seen.push(v)} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Esta cor tem contraste 1,28:1 com o texto branco. Escolha uma com pelo menos 4,5:1 (AA).");
    expect(screen.getByRole("alert").querySelector("svg")).not.toBeNull();
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Pagar")).toBeInTheDocument();
    expect(screen.getByText("Prévia: o texto fica ilegível")).toBeInTheDocument();
    const suggestion = screen.getByRole("button", { name: /^Sugestão: #[0-9A-F]{6} · [\d,]+:1$/ });
    const hex = /#[0-9A-F]{6}/.exec(suggestion.textContent!)![0];
    expect(contrastRatio(hex)).toBeGreaterThanOrEqual(4.5);
    await user.click(suggestion);
    expect(seen).toEqual([hex]);
    expect(field()).toHaveValue(hex);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText(/· AA$/)).toBeInTheDocument();
  });

  it("formato inválido mostra o erro de formato e esconde a prévia", () => {
    render(<Harness start="azul" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Use o formato #RRGGBB");
    expect(screen.queryByText("Prévia no portal")).not.toBeInTheDocument();
  });

  it("desabilitado: campo, amostras e sugestão não respondem", () => {
    render(<Harness start="#F5E663" disabled />);
    expect(field()).toBeDisabled();
    for (const b of screen.getAllByRole("button")) expect(b).toBeDisabled();
  });

  it.each(["#F5E663", "#C8462C", ""])("não tem violações no axe com %j", async (start) => {
    const { container } = render(<Harness start={start} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
