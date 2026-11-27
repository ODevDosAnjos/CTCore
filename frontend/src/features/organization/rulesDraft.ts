import type { CrossUnitTraining, OrganizationRules } from "./useOrganization";

// RF-ORG-01 (D1): faixas das regras da organização, as mesmas do servidor (OrganizationRules.java).
export const RANGES = {
  deactivationDays: [15, 90],
  formerStudentRetentionMonths: [1, 60],
  trialRetentionMonths: [1, 60],
} as const;
export type NumericRule = keyof typeof RANGES;

/** Valores como a pessoa digita (texto), até virarem número no salvar. */
export interface RulesDraft {
  deactivationDays: string;
  formerStudentRetentionMonths: string;
  trialRetentionMonths: string;
  crossUnitTraining: CrossUnitTraining;
}

export const toDraft = (r: OrganizationRules): RulesDraft => ({
  deactivationDays: String(r.deactivationDays),
  formerStudentRetentionMonths: String(r.formerStudentRetentionMonths),
  trialRetentionMonths: String(r.trialRetentionMonths),
  crossUnitTraining: r.crossUnitTraining,
});

export const toRules = (d: RulesDraft): OrganizationRules => ({
  deactivationDays: Number(d.deactivationDays),
  formerStudentRetentionMonths: Number(d.formerStudentRetentionMonths),
  trialRetentionMonths: Number(d.trialRetentionMonths),
  crossUnitTraining: d.crossUnitTraining,
});

/** Campos numéricos fora da faixa (vazio, decimal ou fora do intervalo). */
export function invalidRules(d: RulesDraft): NumericRule[] {
  return (Object.keys(RANGES) as NumericRule[]).filter((key) => {
    const [min, max] = RANGES[key];
    return !/^\d+$/.test(d[key]) || Number(d[key]) < min || Number(d[key]) > max;
  });
}

export const sameRules = (a: RulesDraft, b: RulesDraft) => JSON.stringify(a) === JSON.stringify(b);
