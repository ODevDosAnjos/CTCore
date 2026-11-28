import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TOAST_MS, ToastProvider, useToast } from "./toast";
import { axeViolations } from "@/test/axe";

function Buttons() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success("Salvo")}>ok</button>
      <button onClick={() => toast.warn("Atenção aqui")}>warn</button>
      <button onClick={() => toast.error("Deu erro")}>erro</button>
    </>
  );
}
const setup = () => render(<ToastProvider><Buttons /></ToastProvider>);

describe("Toast", () => {
  afterEach(() => vi.useRealTimers());

  it("CA1: sucesso e atenção somem após 5 s; erro permanece", () => {
    vi.useFakeTimers();
    setup();
    for (const n of ["ok", "warn", "erro"]) act(() => screen.getByText(n).click());
    expect(screen.getByText("Salvo")).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(TOAST_MS + 1));
    expect(screen.queryByText("Salvo")).toBeNull();
    expect(screen.queryByText("Atenção aqui")).toBeNull();
    expect(screen.getByText("Deu erro")).toBeInTheDocument();
  });

  it("CA1: botão de fechar remove o aviso e a região é aria-live", async () => {
    setup();
    await userEvent.click(screen.getByText("erro"));
    await userEvent.click(screen.getByText("ok"));
    expect(screen.getByTestId("toast-live")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("alert")).toHaveTextContent("Deu erro");
    for (const b of screen.getAllByRole("button", { name: "Fechar aviso" })) await userEvent.click(b);
    expect(screen.queryByText("Deu erro")).toBeNull();
    expect(screen.queryByText("Salvo")).toBeNull();
  });

  it("CA2: fora do provider o hook falha com erro claro", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Buttons />)).toThrow("useToast precisa estar dentro de ToastProvider");
    spy.mockRestore();
  });

  it.each(["", "dark"])("CA8: sem violação do axe com aviso aberto (tema %s)", async (theme) => {
    if (theme) document.documentElement.classList.add("dark");
    const { container } = setup();
    for (const n of ["ok", "warn", "erro"]) await userEvent.click(screen.getByText(n));
    expect(await axeViolations(container)).toEqual([]);
  });
});
