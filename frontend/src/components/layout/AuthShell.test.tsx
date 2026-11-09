import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { AuthShell } from "./AuthShell";

function setup() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthShell title="Entrar" subtitle="Use seu e-mail">
          <form>
            <label htmlFor="x">E-mail</label>
            <input id="x" />
          </form>
        </AuthShell>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("AuthShell", () => {
  it("CA11: um h1, painel da marca só a partir de md, ícone ct, formulário de 420 px, suporte e sem botão de tema", () => {
    setup();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByTestId("auth-brand")).toHaveClass("hidden", "md:flex");
    expect(screen.getByRole("main")).toHaveClass("max-w-105");
    expect(screen.getByRole("region", { name: "Precisa de ajuda?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tema/i })).toBeNull();
    expect(screen.getByTestId("auth-brand")).toHaveTextContent("A academia em dia, sem planilha.");
    expect(screen.getByRole("region", { name: "Ajuda" })).toBeInTheDocument();
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("sem violação de acessibilidade no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    const { container } = setup();
    expect(await axeViolations(container)).toEqual([]);
  });
});
