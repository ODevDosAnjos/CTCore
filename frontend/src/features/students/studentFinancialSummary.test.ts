import type { ChargeRow } from "@/features/charges/types";
import { group, summarize } from "./studentFinancialSummary";

const row = (over: Partial<ChargeRow>): ChargeRow => ({
  id: "c", student: { id: "s", name: "A", photoUrl: null }, unit: { id: "u", name: "U" }, type: "MONTHLY", modality: null, referenceMonth: null, description: null,
  amountCents: 16000, dueOn: "2026-10-10", status: "PENDING", payment: null, ...over,
});
const paid = (n: number, at: string) => Array.from({ length: n }, (_, i) => row({ id: `p${i}`, amountCents: 17000, status: "PAID", payment: { method: "PIX_MP", paidAt: at } }));
// 04/11/2026 12:00 no fuso da unidade.
const now = new Date("2026-11-04T15:00:00Z");

describe("resumo financeiro do aluno (CA7)", () => {
  it("soma em aberto, atraso com o maior atraso em dias e pagos do ano", () => {
    const items = [row({ id: "a", status: "OVERDUE", dueOn: "2026-10-10" }), row({ id: "b", amountCents: 18000, dueOn: "2026-11-10" }), row({ id: "c", dueOn: "2026-12-10" }), ...paid(17, "2026-09-09T12:00:00Z"), ...paid(1, "2025-12-31T12:00:00Z")];
    expect(summarize(items, now)).toEqual({
      open: { count: 3, cents: 50000 },
      overdue: { count: 1, cents: 16000, days: 25 },
      paid: { count: 17, cents: 289000, year: "2026" },
    });
  });

  it("sem cobrança paga zera o cartão e sem atraso fica em 0 dias", () => {
    expect(summarize([row({})], now)).toMatchObject({ overdue: { count: 0, days: 0 }, paid: { count: 0, cents: 0 } });
  });

  it("o ano pago vem do fuso da unidade, não do UTC", () => {
    // 01/01/2027 01:00 UTC ainda é 31/12/2026 em São Paulo.
    expect(summarize(paid(1, "2027-01-01T01:00:00Z"), now).paid.count).toBe(1);
  });

  it("agrupa em aberto, pagos e outras", () => {
    const g = group([row({ id: "1", status: "OVERDUE" }), row({ id: "2", status: "IN_REVIEW" }), row({ id: "3", status: "PAID_LATE" }), row({ id: "4", status: "CANCELED" })]);
    expect([g.open.length, g.paid.length, g.other.length]).toEqual([2, 1, 1]);
  });
});
