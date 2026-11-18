import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axeViolations } from "@/test/axe";
import { BodyEditor } from "./BodyEditor";

function Harness({ start = "" }: { start?: string }) {
  const [value, setValue] = useState(start);
  return (
    <>
      <label htmlFor="b">Texto</label>
      <BodyEditor id="b" value={value} onChange={setValue} />
    </>
  );
}
const field = () => screen.getByLabelText("Texto") as HTMLTextAreaElement;

describe("BodyEditor (RN-COM-05, CA11)", () => {
  it("negrito embrulha a seleção em **", async () => {
    const user = userEvent.setup();
    render(<Harness start="Aula hoje" />);
    field().setSelectionRange(5, 9);
    await user.click(screen.getByRole("button", { name: "Negrito" }));
    expect(field()).toHaveValue("Aula **hoje**");
  });

  it("lista põe '- ' no começo da linha onde está o cursor", async () => {
    const user = userEvent.setup();
    render(<Harness start={"Primeira\nSegunda"} />);
    field().setSelectionRange(12, 12);
    await user.click(screen.getByRole("button", { name: "Lista com marcador" }));
    expect(field()).toHaveValue("Primeira\n- Segunda");
  });

  it("link insere [texto](https://) e usa a seleção como texto", async () => {
    const user = userEvent.setup();
    render(<Harness start="Veja o site" />);
    field().setSelectionRange(7, 11);
    await user.click(screen.getByRole("button", { name: "Link" }));
    expect(field()).toHaveValue("Veja o [site](https://)");
  });

  it("lista numerada fica desabilitada com Em breve e o contador usa o texto do canvas", async () => {
    const user = userEvent.setup();
    render(<Harness start="abc" />);
    const numbered = screen.getByRole("button", { name: "Lista numerada" });
    expect(numbered).toHaveAttribute("aria-disabled", "true");
    await user.click(numbered);
    expect(field()).toHaveValue("abc");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    expect(screen.getByText("3 de 2.000 caracteres · negrito, listas e links")).toBeInTheDocument();
  });

  it("bloqueia acima de 2.000 caracteres e passa no axe", async () => {
    const { container } = render(<Harness start={"a".repeat(2000)} />);
    await userEvent.type(field(), "b");
    expect(field().value).toHaveLength(2000);
    expect(await axeViolations(container)).toEqual([]);
  });
});
