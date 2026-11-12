import { describe, expect, it } from "vitest";
import { periodLabel, periodOptions, periodRange } from "./period";

describe("period (D5, CA5)", () => {
  it("lista seis meses antes, o atual e dois depois, com o rótulo do canvas", () => {
    const options = periodOptions(new Date(2026, 9, 15));
    expect(options).toHaveLength(9);
    expect(options[0]).toEqual({ id: "2026-04", name: "Abril/2026" });
    expect(options[6]).toEqual({ id: "2026-10", name: "Outubro/2026" });
    expect(options[8]).toEqual({ id: "2026-12", name: "Dezembro/2026" });
  });

  it("atravessa a virada do ano", () => {
    const options = periodOptions(new Date(2026, 0, 31));
    expect(options[0].id).toBe("2025-07");
    expect(options[8].id).toBe("2026-03");
  });

  it("traduz o mês em primeiro e último dia, inclusive fevereiro bissexto", () => {
    expect(periodRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(periodRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(periodRange("2026-02")?.to).toBe("2026-02-28");
  });

  it("valor inválido não vira filtro", () => {
    expect(periodRange("2026-13")).toBeNull();
    expect(periodRange("")).toBeNull();
    expect(periodLabel("2026-03")).toBe("Março/2026");
  });
});
