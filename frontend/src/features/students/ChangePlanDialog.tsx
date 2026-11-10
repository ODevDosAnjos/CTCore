import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { formatCurrency } from "@/lib/format";
import { changePlan } from "./useStudentRecord";
import { monthLabel, planDescription, type PlanChoice } from "./modalityDialogSummary";
import { combine, ModalityDialog, ReadOnlyField, usePlanChoices } from "./ModalityPickers";
import type { EnrollmentModality } from "./types";

const withValue = (p: PlanChoice | undefined, fallback: string) => [p?.name ?? fallback, p?.valueCents === undefined ? "" : formatCurrency(p.valueCents)].filter(Boolean).join(" · ");

// R10 (RN-MAT-15, D10): o plano novo vale a partir da próxima cobrança; pedir o plano atual limpa o agendamento.
// `initial` é o plano pedido pelo aluno (RN-MAT-16): a janela abre com ele escolhido, e a gestão confere e confirma.
export function ChangePlanDialog({ studentId, row, initial, onClose, onDone }: { studentId: string; row: EnrollmentModality; initial?: string; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "students.record.enrollment.";
  const plans = usePlanChoices(row.unit.id, row.modality.id);
  const [plan, setPlan] = useState(initial ?? row.nextPlan?.id ?? row.plan.id);
  const [reason, setReason] = useState("");
  const { state, retry } = combine(plans);
  const options = plans.data?.items ?? [];
  // O plano atual sem agendamento não muda nada (o servidor recusa com 422).
  const changes = !!plan && (plan !== row.plan.id || !!row.nextPlan);
  const text = reason.trim();
  const chosen = options.find((p) => p.id === plan);
  const summary =
    plan !== row.plan.id
      ? [
          t(`${k}plan.summary.current`, { plan: withValue(options.find((p) => p.id === row.plan.id), row.plan.name) }),
          t(`${k}plan.summary.next`, { plan: withValue(chosen, row.nextPlan?.name ?? plan) }),
          t(`${k}plan.summary.from`, { month: monthLabel(t, 1), previous: monthLabel(t, 0) }),
        ]
      : [];
  return (
    <ModalityDialog
      size="sm"
      title={t(`${k}plan.title`)}
      state={state}
      retry={retry}
      cancelLabel={t("common.cancel")}
      submitLabel={t(`${k}plan.submit`)}
      canSubmit={changes && text.length >= 3}
      summary={summary}
      reason={{ label: t(`${k}reasonLabel`), value: reason, onChange: setReason }}
      work={() => changePlan(studentId, row.id, plan, text)}
      onClose={onClose}
      onDone={onDone}
    >
      {(errors) => (
        <>
          <ReadOnlyField label={t(`${k}readOnlyModality`)} value={row.modality.name} />
          <div>
            <ChoiceCards
              legend={t(`${k}plan.next`)}
              value={plan}
              onChange={setPlan}
              options={options.map((p) => ({ value: p.id, label: p.name, description: planDescription(t, p), aside: p.valueCents === undefined ? undefined : formatCurrency(p.valueCents) }))}
            />
            {errors.planId && <p className="text-sm text-danger-foreground">{errors.planId}</p>}
          </div>
        </>
      )}
    </ModalityDialog>
  );
}
