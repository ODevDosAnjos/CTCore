import type { TFunction } from "i18next";
import { formatMoney } from "@/components/fields/masks";
import { benefitValue } from "./request";
import type { BenefitDraft } from "./types";

/** Desconto em centavos do benefício sobre o plano (RN-BEN-02: 1 a 100 % ou valor, nunca abaixo de zero). */
export function discountCents(planCents: number, b: BenefitDraft): number {
  const v = b.on ? benefitValue(b) : null;
  if (v === null) return 0;
  return Math.min(planCents, b.type === "PERCENT" ? Math.round((planCents * v) / 100) : v);
}

/** "Mensalidade: R$ 150,00 − 10% = R$ 135,00"; sem benefício, só o valor do plano. */
export function monthlyText(t: TFunction, planCents: number, b: BenefitDraft): string {
  const off = discountCents(planCents, b);
  const k = "enrollmentWizard.modalities.";
  if (off === 0) return t(`${k}monthlyPlain`, { plan: formatMoney(planCents) });
  const minus = b.type === "PERCENT" ? `${benefitValue(b)}%` : formatMoney(off);
  return t(`${k}monthly`, { plan: formatMoney(planCents), minus, total: formatMoney(planCents - off) });
}
