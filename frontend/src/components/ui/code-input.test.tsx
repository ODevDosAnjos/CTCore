import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { CodeInput } from "./code-input";
import { Field } from "./field";
import { axeViolations } from "@/test/axe";

function Host({ onComplete }: { onComplete?: (v: string) => void }) {
  const [v, setV] = useState("");
  return <Field label="Código">{(c) => <CodeInput {...c} value={v} onChange={setV} onComplete={onComplete} />}</Field>;
}

describe("CodeInput (CA7, CA10)", () => {
  it("6 caixas; digitar preenche; letras ignoradas; Backspace apaga", async () => {
    const { container } = render(<Host />);
    expect(container.querySelectorAll("span[aria-hidden]")).toHaveLength(6);
    const input = screen.getByLabelText("Código");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
    expect(input).toHaveAttribute("inputmode", "numeric");
    await userEvent.type(input, "4a82");
    expect(input).toHaveValue("482");
    expect(container.querySelectorAll("span[aria-hidden]")[2]).toHaveTextContent("2");
    await userEvent.keyboard("{Backspace}");
    expect(input).toHaveValue("48");
  });
  it("colar 482 913 entrega 482913 e chama onComplete", async () => {
    const done = vi.fn();
    render(<Host onComplete={done} />);
    await userEvent.click(screen.getByLabelText("Código"));
    await userEvent.paste("482 913");
    expect(screen.getByLabelText("Código")).toHaveValue("482913");
    expect(done).toHaveBeenCalledWith("482913");
  });
  it("sem rolagem lateral (min-w-0 flex-1) e axe", async () => {
    const { container } = render(<Host />);
    expect(container.querySelector("span[aria-hidden]")).toHaveClass("min-w-0", "flex-1");
    expect(await axeViolations(container)).toEqual([]);
  });
});
