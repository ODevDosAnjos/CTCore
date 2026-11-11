import { render, screen } from "@testing-library/react";
import { FirstChargeTable } from "./FirstChargeTable";

describe("FirstChargeTable", () => {
  it("taxa isenta mostra o selo, o valor riscado e o total sem ela", () => {
    render(
      <FirstChargeTable
        total={13500}
        rows={[
          { key: "m", label: "Jiu-Jitsu · out/2026 (primeiro mês)", due: "08/10/2026", cents: 13500 },
          { key: "f", label: "Taxa de matrícula", badge: "Isenta", due: "08/10/2026", struck: 8000, cents: 0 },
        ]}
      />,
    );
    expect(screen.getByText("Isenta")).toBeInTheDocument();
    expect(screen.getByText("R$ 80,00").tagName).toBe("DEL");
    expect(screen.getByRole("row", { name: /Total/ })).toHaveTextContent("R$ 135,00");
  });
  it("com a coluna por meio mostra o texto da linha ou o traço", () => {
    render(
      <FirstChargeTable
        withMethods
        rows={[
          { key: "m", label: "Mensalidade", due: "08/10/2026", cents: 13500, methods: "Pix R$ 135,68 · Cartão R$ 139,73" },
          { key: "f", label: "Taxa (isenta)", due: "—", cents: 0 },
        ]}
      />,
    );
    expect(screen.getByText("Pix R$ 135,68 · Cartão R$ 139,73")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Por meio, com a taxa" })).toBeInTheDocument();
  });
});
