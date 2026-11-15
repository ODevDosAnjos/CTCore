import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Field, Input, Select } from "@/components/ui/field";
import { RadioCard } from "@/components/ui/radio-card";
import type { NumericRule, RulesDraft } from "./rulesDraft";
import type { CrossUnitTraining } from "./useOrganization";

const CROSS: CrossUnitTraining[] = ["allowed", "denied", "plan"];
type Errors = Partial<Record<NumericRule | "crossUnitTraining", string>>;

function NumberRule({ rule, unit, hint, draft, set, canEdit, error }: { rule: NumericRule; unit: "days" | "months"; hint?: boolean; draft: RulesDraft; set: (key: NumericRule, value: string) => void; canEdit: boolean; error?: string }) {
  const { t } = useTranslation();
  return (
    <Field label={t(`organization.rules.${rule}`)} hint={hint && !error ? t(`organization.rules.${rule}Hint`) : undefined} error={error}>
      {(c) => (
        <span className="relative flex items-center">
          <Input {...c} inputMode="numeric" autoComplete="off" disabled={!canEdit} value={draft[rule]} onChange={(e) => set(rule, e.target.value.trim())} className="pr-16" />
          <span aria-hidden="true" className="pointer-events-none absolute right-3 text-[13px] text-muted-foreground">
            {t(`organization.rules.${unit}`)}
          </span>
        </span>
      )}
    </Field>
  );
}

// RF-ORG-01 / RN-ORG-13: cartão "Regras da organização". Os valores são do formulário da tela; aqui só se mostra e se digita.
export function RulesCard({ draft, onChange, canEdit, errors }: { draft: RulesDraft; onChange: (next: RulesDraft) => void; canEdit: boolean; errors: Errors }) {
  const { t } = useTranslation();
  const set = <K extends keyof RulesDraft>(key: K, value: RulesDraft[K]) => onChange({ ...draft, [key]: value });
  const shared = { draft, set, canEdit };
  return (
    <Card heading="h2" title={t("organization.rules.title")}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberRule rule="deactivationDays" unit="days" hint error={errors.deactivationDays} {...shared} />
          <NumberRule rule="formerStudentRetentionMonths" unit="months" error={errors.formerStudentRetentionMonths} {...shared} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberRule rule="trialRetentionMonths" unit="months" hint error={errors.trialRetentionMonths} {...shared} />
          <Field label={t("organization.rules.trialLimit")} error={errors.trialLimit}>
            {(c) => (
              <Select {...c} disabled={!canEdit} value={draft.trialLimit} onChange={(e) => set("trialLimit", e.target.value)}>
                {[1, 2, 3].map((n) => (
                  <option key={n} value={String(n)}>
                    {n}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium">{t("organization.rules.crossUnitTraining")}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {CROSS.map((value) => (
              <RadioCard
                key={value}
                name="cross-unit-training"
                label={t(`organization.rules.crossUnit.${value}`)}
                checked={draft.crossUnitTraining === value}
                disabled={!canEdit}
                onChange={() => set("crossUnitTraining", value)}
              />
            ))}
          </div>
          {errors.crossUnitTraining && (
            <p role="alert" className="text-xs text-danger-foreground">
              {errors.crossUnitTraining}
            </p>
          )}
        </fieldset>
        <div className="flex flex-col gap-0.5">
          <ComingSoon variant="switch" label={t("organization.rules.proof")} />
          <span className="text-[13px] text-muted-foreground">{t("organization.rules.proofNote")}</span>
        </div>
      </div>
    </Card>
  );
}
