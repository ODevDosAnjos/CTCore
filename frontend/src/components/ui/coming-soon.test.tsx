import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComingSoon, type ComingSoonVariant } from "./coming-soon";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";

const VARIANTS: [ComingSoonVariant, string][] = [["button", "button"], ["tab", "button"], ["switch", "switch"], ["link", "link"], ["menuitem", "menuitem"]];

function setup(variant: ComingSoonVariant) {
  const onClick = vi.fn();
  const view = render(
    <div role={variant === "menuitem" ? "menu" : undefined} onClick={onClick}>
      <ComingSoon variant={variant} label="Recurso" />
    </div>,
  );
  return { onClick, ...view };
}

describe.each(VARIANTS)("ComingSoon %s", (variant, role) => {
  it("CA1/CA3: ignora clique e teclado, mas recebe foco", async () => {
    const u = userEvent.setup();
    const { container } = setup(variant);
    const el = screen.getByRole(role, { name: "Recurso" });
    expect(el).not.toHaveAttribute("href");
    await u.click(el);
    el.focus();
    await u.keyboard("{Enter} ");
    expect(screen.queryByRole("dialog")).toBeNull();
    await u.tab();
    expect(container.ownerDocument.activeElement).not.toBeNull();
    el.focus();
    expect(el).toHaveFocus();
  });

  it("CA2/CA4: selo, dica ligada por aria-describedby e aria-disabled", () => {
    setup(variant);
    const el = screen.getByRole(role, { name: "Recurso" });
    expect(el).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("Em breve")).toBeInTheDocument();
    expect(el).toHaveAccessibleDescription("Disponível em uma próxima versão");
  });

  it.each([false, true])("CA5: axe sem violações (escuro=%s)", async (dark) => {
    setDevicePrefersDark(dark);
    const { container } = setup(variant);
    expect(await axeViolations(container)).toEqual([]);
  });
});

it("CA1: nenhuma variante dispara onClick próprio (não há prop)", async () => {
  const u = userEvent.setup();
  const { onClick } = setup("button");
  await u.click(screen.getByRole("button", { name: "Recurso" }));
  // o clique borbulha ao contêiner, mas o componente em si não faz nada; sem navegação
  expect(window.location.href).toBe("http://localhost:3000/");
  expect(onClick).toHaveBeenCalledTimes(1);
});
