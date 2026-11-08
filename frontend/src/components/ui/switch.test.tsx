import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";
import { axeViolations } from "@/test/axe";

describe("Switch (CA5)", () => {
  it("descrição visível ligada por aria-describedby; clique alterna", async () => {
    const fn = vi.fn();
    const { container } = render(<Switch label="Avisos" description="Receber por e-mail" checked={false} onCheckedChange={fn} />);
    expect(screen.getByText("Receber por e-mail")).toBeVisible();
    expect(screen.getByRole("switch", { name: "Avisos" })).toHaveAccessibleDescription("Receber por e-mail");
    await userEvent.click(screen.getByRole("switch"));
    expect(fn).toHaveBeenCalledWith(true);
    expect(await axeViolations(container)).toEqual([]);
  });
  it("disabled bloqueia e sem descrição fica como antes", async () => {
    const fn = vi.fn();
    render(<Switch label="X" checked disabled onCheckedChange={fn} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(fn).not.toHaveBeenCalled();
    expect(screen.getByRole("switch")).not.toHaveAttribute("aria-describedby");
  });
});
