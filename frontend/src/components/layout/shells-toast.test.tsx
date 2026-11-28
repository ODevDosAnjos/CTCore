import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AuthShell } from "./AuthShell";
import { useToast } from "@/components/ui/toast";

function Fire() {
  const toast = useToast();
  return <button onClick={() => toast.success("Pronto")}>avisar</button>;
}

// CA2: o aviso funciona dentro da moldura de acesso; ManagementShell e PortalShell são cobertos pelos testes de moldura.
describe("molduras e aviso", () => {
  it("CA2: AuthShell exibe o aviso", async () => {
    render(<MemoryRouter><AuthShell title="Entrar"><Fire /></AuthShell></MemoryRouter>);
    await userEvent.click(screen.getByText("avisar"));
    expect(await screen.findByText("Pronto")).toBeInTheDocument();
  });
});
