import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ChoiceCards } from "./choice-cards";

const onChange = vi.fn();
function Harness() {
  const [v, setV] = useState("a");
  return (
    <ChoiceCards
      legend="Motivo"
      columns={2}
      value={v}
      onChange={(x) => {
        onChange(x);
        setV(x);
      }}
      options={[{ value: "a", label: "Um" }, { value: "b", label: "Dois" }, { value: "c", label: "Três" }]}
    />
  );
}

describe("ChoiceCards (CA3)", () => {
  it("clique e setas trocam a escolha; só uma fica marcada; legenda nomeia o grupo", async () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Motivo" })).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Três"));
    expect(onChange).toHaveBeenLastCalledWith("c");
    await userEvent.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith("b");
    expect(screen.getAllByRole("radio").filter((r) => (r as HTMLInputElement).checked)).toHaveLength(1);
    expect(screen.getByLabelText("Dois")).toBeChecked();
  });
});
