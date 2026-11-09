import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SegmentedChoice } from "./segmented-choice";

const onChange = vi.fn();
function Harness() {
  const [v, setV] = useState("keep");
  return (
    <SegmentedChoice
      label="Cobrança de março"
      value={v}
      onChange={(x) => {
        onChange(x);
        setV(x);
      }}
      options={[{ value: "keep", label: "Manter" }, { value: "cancel", label: "Cancelar" }]}
    />
  );
}

describe("SegmentedChoice (CA4)", () => {
  it("clique e setas trocam a opção; alvo de 44 px", async () => {
    render(<Harness />);
    expect(screen.getByRole("radiogroup", { name: "Cobrança de março" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Manter" })).toBeChecked();
    await userEvent.click(screen.getByText("Cancelar"));
    expect(onChange).toHaveBeenLastCalledWith("cancel");
    expect(screen.getByRole("radio", { name: "Cancelar" })).toBeChecked();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "Manter" })).toBeChecked();
    for (const r of screen.getAllByRole("radio")) expect(r.closest("label")).toHaveClass("min-h-11");
  });
});
