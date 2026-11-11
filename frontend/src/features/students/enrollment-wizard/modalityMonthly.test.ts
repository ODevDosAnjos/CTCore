import { t } from "i18next";
import { emptyBenefit } from "./request";
import { discountCents, monthlyText } from "./modalityMonthly";

const b = (p: Partial<ReturnType<typeof emptyBenefit>>) => ({ ...emptyBenefit(), on: true, ...p });
const clean = (s: string) => s.replace(/\u00a0/g, " ");

describe("mensalidade com benefício (CA11)", () => {
  it("porcentagem, valor e sem benefício", () => {
    expect(clean(monthlyText(t, 15000, b({ percent: "10" })))).toBe("Mensalidade: R$ 150,00 − 10% = R$ 135,00");
    expect(clean(monthlyText(t, 15000, b({ type: "AMOUNT", amount: 1500 })))).toBe("Mensalidade: R$ 150,00 − R$ 15,00 = R$ 135,00");
    expect(clean(monthlyText(t, 15000, emptyBenefit()))).toBe("Mensalidade: R$ 150,00");
  });
  it("o desconto nunca passa do plano", () => {
    expect(discountCents(1000, b({ type: "AMOUNT", amount: 5000 }))).toBe(1000);
    expect(discountCents(1000, b({ percent: "0" }))).toBe(0);
  });
});
