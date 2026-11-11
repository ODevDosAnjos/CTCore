import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CpfField, PhoneField } from "@/components/fields/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/features/units/Text";
import { maskCpf } from "./enrollmentFormat";
import type { GuardianDraft } from "./types";

// Cartão do responsável (R4): nome, CPF (mascarado depois de completo), celular, e-mail e "Responsável financeira".
export function GuardianCard({
  index,
  value,
  errors,
  alone,
  onChange,
  onFinancial,
  onRemove,
}: {
  index: number;
  value: GuardianDraft;
  errors: Record<string, string>;
  alone: boolean;
  onChange: (patch: Partial<GuardianDraft>) => void;
  onFinancial: () => void;
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.student.form.";
  const masked = maskCpf(value.cpf);
  return (
    <section aria-label={t(`${k}guardianCard`, { n: index + 1 })} className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{value.name.trim() || t(`${k}guardianCard`, { n: index + 1 })}</h3>
        {onRemove && (
          <Button type="button" variant="outline" size="icon" aria-label={t(`${k}guardianRemove`)} onClick={onRemove}>
            <Trash2 aria-hidden="true" />
          </Button>
        )}
      </div>
      {masked && <p className="text-xs text-muted-foreground">{t(`${k}guardianCpfMasked`, { cpf: masked })}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Text label={t(`${k}guardianName`)} value={value.name} onChange={(name) => onChange({ name })} error={errors[`guardian${index}Name`]} autoComplete="off" />
        <div>
          <CpfField label={t(`${k}guardianCpf`)} initial={value.cpf} onChange={(cpf) => onChange({ cpf })} autoComplete="off" />
          {errors[`guardian${index}Cpf`] && <p className="text-xs text-danger-foreground">{errors[`guardian${index}Cpf`]}</p>}
        </div>
        <div>
          <PhoneField label={t(`${k}guardianPhone`)} initial={value.phone} onChange={(phone) => onChange({ phone })} autoComplete="off" />
          {errors[`guardian${index}Phone`] && <p className="text-xs text-danger-foreground">{errors[`guardian${index}Phone`]}</p>}
        </div>
        <Text label={t(`${k}guardianEmail`)} type="email" value={value.email} onChange={(email) => onChange({ email })} error={errors[`guardian${index}Email`]} autoComplete="off" />
      </div>
      <Checkbox label={t(`${k}guardianFinancial`)} checked={value.financial} disabled={alone} onChange={onFinancial} />
    </section>
  );
}
