import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnitMenu, type UnitMenuProps } from "./UnitMenu";

const units = [
  { id: "a", name: "Tijuca" },
  { id: "b", name: "Barra" },
];
const base: UnitMenuProps = { status: "ready", units, allUnits: true, selected: "all", onSelect: () => {}, onRetry: () => {} };

describe("UnitMenu", () => {
  it("CA8: uma unidade é só rótulo, sem botão; sem unidade ou sem permissão não aparece", () => {
    const { container, rerender } = render(<UnitMenu {...base} units={units.slice(0, 1)} allUnits={false} selected="a" />);
    expect(screen.getByText("Tijuca")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    rerender(<UnitMenu {...base} units={[]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<UnitMenu {...base} status="forbidden" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("CA8: desktop abre a lista com Todas as unidades e Só consulta; escolher grava e fecha", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UnitMenu {...base} onSelect={onSelect} />);
    const botao = screen.getByRole("button", { name: "Unidade ativa: Todas as unidades" });
    await user.click(botao);
    const lista = screen.getByRole("list");
    expect(within(lista).getByText("Só consulta")).toBeInTheDocument();
    await user.click(within(lista).getByRole("button", { name: "Barra" }));
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("list")).toBeNull();
    expect(botao).toHaveFocus();
  });

  it("CA8: sem a abrangência a opção Todas não aparece", async () => {
    const user = userEvent.setup();
    render(<UnitMenu {...base} allUnits={false} selected="a" />);
    await user.click(screen.getByRole("button", { name: /Unidade ativa/ }));
    expect(screen.queryByText("Todas as unidades")).toBeNull();
  });

  it("CA9: carregando é aviso acessível; erro mostra a mensagem e Tentar de novo", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { rerender } = render(<UnitMenu {...base} status="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando unidades...");
    rerender(<UnitMenu {...base} status="error" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar as unidades.");
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("CA11: celular abre a folha com título, cartões, Só consulta · Coordenador; escolher fecha; Esc fecha e devolve o foco", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UnitMenu {...base} variant="mobile" onSelect={onSelect} />);
    const botao = screen.getByRole("button", { name: "Unidade ativa: Todas as unidades" });
    await user.click(botao);
    const folha = screen.getByRole("dialog", { name: "Unidade" });
    expect(within(folha).getAllByRole("radio")).toHaveLength(3);
    expect(within(folha).getByText("Só consulta · Coordenador")).toBeInTheDocument();
    expect(within(folha).getByRole("radio", { name: /Todas as unidades/ })).toBeChecked();
    expect(within(folha).getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(botao).toHaveFocus();
    await user.click(botao);
    await user.click(screen.getByRole("radio", { name: "Barra" }));
    expect(onSelect).toHaveBeenCalledWith("b");
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(botao);
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
