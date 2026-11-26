import { render, screen } from "@testing-library/react";
import { PortalHeading } from "./PortalHeading";

describe("PortalHeading (CA8)", () => {
  it("mostra rótulo opcional e título", () => {
    const { rerender } = render(<PortalHeading label="Financeiro" title="Cobranças" />);
    expect(screen.getByRole("heading", { level: 1, name: "Cobranças" })).toBeInTheDocument();
    expect(screen.getByText("Financeiro")).toBeInTheDocument();
    rerender(<PortalHeading title="Cobranças" />);
    expect(screen.queryByText("Financeiro")).toBeNull();
  });
});
