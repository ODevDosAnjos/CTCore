import { render, screen } from "@testing-library/react";
import { PortalHeading } from "./PortalHeading";

describe("PortalHeading (CA8)", () => {
  it("mostra rótulo, título e subtítulo opcional", () => {
    const { rerender } = render(<PortalHeading label="Financeiro" title="Cobranças" subtitle="Tudo em dia" />);
    expect(screen.getByRole("heading", { level: 1, name: "Cobranças" })).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    expect(screen.getByText("Tudo em dia")).toBeInTheDocument();
    rerender(<PortalHeading title="Cobranças" />);
    expect(screen.queryByText("Financeiro")).toBeNull();
    expect(screen.queryByText("Tudo em dia")).toBeNull();
  });
});
