import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileField } from "./file-field";
import { Field } from "./field";
import { axeViolations } from "@/test/axe";

const ui = () => (
  <Field id="f" label="Imagem">
    {(c) => <FileField {...c} accept="image/*" aria-describedby="x" />}
  </Field>
);

describe("FileField (CA3, CA4, CA10)", () => {
  it("mostra botão e estado vazio; depois o nome do arquivo", async () => {
    render(ui());
    expect(screen.getByRole("button", { name: "Escolher arquivo" })).toBeInTheDocument();
    expect(screen.getByText("Nenhum arquivo escolhido")).toBeInTheDocument();
    await userEvent.upload(screen.getByLabelText("Imagem"), new File(["a"], "foto.png", { type: "image/png" }));
    expect(screen.getByText("foto.png")).toBeInTheDocument();
  });
  it("o botão clica o input real; accept e describedby chegam a ele", async () => {
    render(ui());
    const input = screen.getByLabelText("Imagem");
    expect(input).toHaveAttribute("accept", "image/*");
    expect(input).toHaveAttribute("aria-describedby", "x");
    const click = vi.spyOn(input as HTMLInputElement, "click");
    await userEvent.click(screen.getByRole("button", { name: "Escolher arquivo" }));
    expect(click).toHaveBeenCalled();
  });
  it("axe nos dois temas", async () => {
    const { container } = render(ui());
    expect(await axeViolations(container)).toEqual([]);
    document.documentElement.classList.add("dark");
    expect(await axeViolations(container)).toEqual([]);
    document.documentElement.classList.remove("dark");
  });
});
