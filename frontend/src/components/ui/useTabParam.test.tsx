import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LocationProbe, currentLocation, history } from "@/test/location";
import { useTabParam } from "./useTabParam";

const IDS = ["a", "b", "c"] as const;

function Probe() {
  const [aba, setAba] = useTabParam(IDS);
  return <button onClick={() => setAba("c")}>ativa {aba}</button>;
}

const open = (to: string) =>
  render(
    <MemoryRouter initialEntries={["/antes", to]} initialIndex={1}>
      <LocationProbe />
      <Probe />
    </MemoryRouter>,
  );

describe("useTabParam (RNF-27, D5)", () => {
  it("CA8: aba ausente ou inválida vale a padrão, sem erro", () => {
    open("/x?aba=nada");
    expect(screen.getByRole("button")).toHaveTextContent("ativa a");
  });

  it("#747 D2: com outro nome de parâmetro, lê e grava nele sem tocar em ?aba=", async () => {
    function Inner() {
      const [kind, setKind] = useTabParam(IDS, "a", "termo");
      return <button onClick={() => setKind("c")}>tipo {kind}</button>;
    }
    render(
      <MemoryRouter initialEntries={["/x?aba=b&termo=b"]}>
        <LocationProbe />
        <Inner />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("tipo b");
    await userEvent.click(screen.getByRole("button"));
    expect(currentLocation().search).toBe("?aba=b&termo=c");
  });

  it("CA8: lê a aba do endereço", () => {
    open("/x?aba=b");
    expect(screen.getByRole("button")).toHaveTextContent("ativa b");
  });

  it("CA9: trocar de aba mantém os filtros e não acrescenta entrada ao histórico", async () => {
    open("/x?status=OVERDUE&pagina=2");
    await userEvent.click(screen.getByRole("button"));
    expect(currentLocation().search).toBe("?status=OVERDUE&pagina=2&aba=c");
    act(() => history(-1)); // volta para o que havia antes da tela, não para a aba anterior
    await waitFor(() => expect(currentLocation().pathname).toBe("/antes"));
  });
});
