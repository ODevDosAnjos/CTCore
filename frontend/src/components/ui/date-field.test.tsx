import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { DateField } from "./date-field";
import { axeViolations } from "@/test/axe";

function Host({ type }: { type?: "date" | "datetime-local" }) {
  const [v, setV] = useState(type === "datetime-local" ? "2026-11-09T10:30" : "2026-11-09");
  return <DateField aria-label="Data" type={type} min="2026-11-01" aria-invalid value={v} onChange={(e) => setV(e.target.value)} />;
}

describe("DateField (CA1, CA2, CA10)", () => {
  it("recebe e devolve ISO; min e aria-invalid passam", async () => {
    render(<Host />);
    const el = screen.getByLabelText("Data");
    expect(el).toHaveValue("2026-11-09");
    expect(el).toHaveAttribute("min", "2026-11-01");
    expect(el).toHaveAttribute("aria-invalid", "true");
    await userEvent.clear(el);
    await userEvent.type(el, "2026-12-01");
    expect(el).toHaveValue("2026-12-01");
  });
  it("datetime-local mantém o formato nativo", () => {
    render(<Host type="datetime-local" />);
    expect(screen.getByLabelText("Data")).toHaveValue("2026-11-09T10:30");
  });
  it("declara esquema de cor claro e escuro e passa no axe", async () => {
    const { container } = render(<Host />);
    expect(screen.getByLabelText("Data")).toHaveClass("[color-scheme:light]", "dark:[color-scheme:dark]");
    expect(await axeViolations(container)).toEqual([]);
    document.documentElement.classList.add("dark");
    expect(await axeViolations(container)).toEqual([]);
    document.documentElement.classList.remove("dark");
  });
});
