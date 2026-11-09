import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PortalAccount } from "./PortalAccount";

describe("PortalAccount (CA4)", () => {
  it("mostra iniciais, nome e perfil e leva a /conta", () => {
    render(
      <MemoryRouter>
        <PortalAccount name="Ana Silva" roleLabel="Responsável" />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link", { name: /Minha conta/ });
    expect(link).toHaveAttribute("href", "/conta");
    expect(link).toHaveTextContent("ASAna SilvaResponsável");
    expect(screen.queryByText("Minha conta", { selector: ".underline" })).toBeNull();
  });
});
