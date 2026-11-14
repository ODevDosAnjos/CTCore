import { longDate, methodRows, registrarRows, shiftDay } from "./receiptRows";

const m = (method: string, count: number, totalCents: number, feePassedCents = 0) => ({ method, count, totalCents, feePassedCents });

describe("receiptRows (RF-COB-08, D2)", () => {
  it("soma crédito e débito em Cartão pelo portal, ordena como o canvas e monta o Total", () => {
    const { rows, total } = methodRows([m("PIX_KEY", 1, 16000), m("DEBIT_CARD", 2, 30000, 100), m("PIX_MP", 3, 100000, 500), m("CREDIT_CARD", 1, 46000, 2560), m("CASH", 4, 34000), m("BOLETO", 1, 18000, 349)]);
    expect(rows.map((r) => r.key)).toEqual(["PIX_MP", "CARD", "BOLETO", "CASH", "PIX_KEY"]);
    expect(rows[1]).toEqual({ key: "CARD", count: 3, totalCents: 76000, feeCents: 2660 });
    expect(total).toEqual({ key: "TOTAL", count: 12, totalCents: 244000, feeCents: 3509 });
  });

  it("sem pagamentos o Total é zero", () => {
    expect(methodRows([]).total).toMatchObject({ count: 0, totalCents: 0, feeCents: 0 });
  });

  it("lançadores do maior valor ao menor; sem lançador fica com id nulo", () => {
    const rows = registrarRows([
      { registeredBy: { id: "c", name: "Carla" }, count: 2, totalCents: 5600 },
      { registeredBy: null, count: 14, totalCents: 25720 },
    ]);
    expect(rows.map((r) => r.id)).toEqual([null, "c"]);
  });

  it("data por extenso em português, sem -feira", () => {
    expect(longDate("2026-10-08")).toBe("Quinta, 8 de outubro de 2026");
    expect(shiftDay("2026-10-01", -1)).toBe("2026-09-30");
  });
});
