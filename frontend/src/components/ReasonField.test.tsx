import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { ReasonField } from "./ReasonField";

function Harness({ error }: { error?: string }) {
  const [v, setV] = useState("");
  return <ReasonField label="Motivo" value={v} onChange={setV} note="Fica na auditoria" error={error} />;
}

describe("ReasonField (CA2)", () => {
  it("campo obrigatório com contador, nota e erro ligados ao campo", () => {
    render(<Harness error="Informe o motivo" />);
    const field = screen.getByRole("textbox", { name: /Motivo/ });
    expect(field).toHaveAttribute("aria-required", "true");
    expect(field).toHaveAttribute("aria-invalid", "true");
    const described = field.getAttribute("aria-describedby")!;
    expect(described).toContain(screen.getByText("Informe o motivo").id);
    expect(described).toContain(screen.getByText("Fica na auditoria").id);
    expect(screen.getByText("0/200")).toBeInTheDocument();
  });

  it("não aceita mais de 200 caracteres", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.paste("a".repeat(250));
    expect(screen.getByText("200/200")).toBeInTheDocument();
  });
});
