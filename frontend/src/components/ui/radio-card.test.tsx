import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RadioCard } from "./radio-card";
import { axeViolations } from "@/test/axe";

describe("RadioCard (CA6, CA10)", () => {
  it("marcado ganha destaque por token e setas trocam a escolha", async () => {
    const { container } = render(
      <fieldset>
        <RadioCard name="p" label="Mensal" description="Todo mês" defaultChecked />
        <RadioCard name="p" label="Anual" />
      </fieldset>,
    );
    expect(screen.getByText("Mensal").closest("label")).toHaveClass("has-[:checked]:border-brand", "has-[:checked]:bg-acc");
    await userEvent.click(screen.getByLabelText(/Mensal/));
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByLabelText("Anual")).toBeChecked();
    expect(await axeViolations(container)).toEqual([]);
  });
});
