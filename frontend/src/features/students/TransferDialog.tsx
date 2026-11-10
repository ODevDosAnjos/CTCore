import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SegmentedChoice } from "@/components/ui/segmented-choice";
import { Text } from "@/features/units/Text";
import { formatCurrency } from "@/lib/format";
import { transferModality, useResource } from "./useStudentRecord";
import { classLabel, monthLabel } from "./modalityDialogSummary";
import { combine, ModalityDialog, OtherClasses, PickSelect, ReadOnlyField, useClassChoices, usePlanChoices, type Choice } from "./ModalityPickers";
import type { Enrollment, EnrollmentModality } from "./types";

// R11 (RN-MAT-20, RN-ORG-12): leva a modalidade para outra unidade, com turma, plano e vencimento da unidade nova; a mesma linha segue (histórico e graduação ficam).
export function TransferDialog({ studentId, enrollment, row, onClose, onDone }: { studentId: string; enrollment: Enrollment; row: EnrollmentModality; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "students.record.enrollment.";
  const units = useResource<{ units: Choice[] }>("/units/reachable");
  const [unit, setUnit] = useState("");
  const [primary, setPrimary] = useState("");
  const [others, setOthers] = useState<string[]>([]);
  const [plan, setPlan] = useState("");
  const [day, setDay] = useState("");
  const [reason, setReason] = useState("");
  const classes = useClassChoices(unit || null, row.modality.id);
  const plans = usePlanChoices(unit || null, row.modality.id);
  // Só informam o resumo e os dias: se falharem, a janela segue (o dia vira campo numérico e a linha da mensalidade sai).
  const current = usePlanChoices(row.unit.id, row.modality.id);
  const settings = useResource<{ settings: { dueDays: number[] } }>(unit ? `/units/${unit}` : null);
  const { state, retry } = combine(units, ...(unit ? [classes, plans] : []));
  // RN-MAT-03: com outra modalidade ativa na unidade nova, o dia é o dela.
  const inherited = enrollment.modalities.find((m) => m.id !== row.id && m.status === "ACTIVE" && m.unit.id === unit)?.dueDay;
  const days = settings.status === "ready" ? settings.data?.settings.dueDays : undefined;
  const unitName = units.data?.units.find((u) => u.id === unit)?.name ?? "";
  const pickUnit = (id: string) => {
    setUnit(id);
    setPrimary("");
    setOthers([]);
    setPlan("");
    setDay("");
  };
  const text = reason.trim();
  const planOptions = plans.data?.items ?? [];
  const from = current.data?.items.find((p) => p.id === row.plan.id)?.valueCents;
  const to = planOptions.find((p) => p.id === plan)?.valueCents;
  const summary =
    unit && plan
      ? [
          ...(from !== undefined && to !== undefined
            ? [
                t(`${k}transfer.summary.fee`, { from: formatCurrency(from), to: formatCurrency(to), month: monthLabel(t, 1) }),
                t(`${k}transfer.summary.kept`, { previous: monthLabel(t, 0), from: formatCurrency(from), unit: row.unit.name }),
              ]
            : []),
          t(`${k}transfer.summary.notice`, { unit: unitName }),
        ]
      : [];
  return (
    <ModalityDialog
      size="sm"
      title={t(`${k}transfer.title`)}
      effect={t(`${k}transfer.effect`)}
      state={state}
      retry={retry}
      cancelLabel={t("common.cancel")}
      submitLabel={t(`${k}transfer.submit`)}
      canSubmit={!!unit && !!primary && !!plan && (inherited !== undefined || !!day) && text.length >= 3}
      summary={summary}
      reason={{ label: t(`${k}reasonLabel`), value: reason, onChange: setReason }}
      work={() =>
        transferModality(studentId, row.id, {
          unitId: unit,
          primaryClassId: primary,
          otherClassIds: others.filter((id) => id !== primary),
          planId: plan,
          ...(inherited === undefined ? { dueDay: Number(day) } : {}),
          reason: text,
        })
      }
      onClose={onClose}
      onDone={onDone}
    >
      {(errors) => (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <ReadOnlyField label={t(`${k}readOnlyModality`)} value={row.modality.name} />
            <ReadOnlyField label={t(`${k}transfer.from`)} value={row.unit.name} />
            <PickSelect label={t(`${k}transfer.unit`)} value={unit} onChange={pickUnit} options={(units.data?.units ?? []).filter((u) => u.id !== row.unit.id)} error={errors.unitId} />
          </div>
          {unit && (
            <>
              <PickSelect label={t(`${k}transfer.class`, { unit: unitName })} value={primary} onChange={setPrimary} options={(classes.data?.items ?? []).map((c) => ({ id: c.id, name: classLabel(t, c) }))} error={errors.primaryClassId} />
              <OtherClasses options={classes.data?.items ?? []} primary={primary} value={others} onChange={setOthers} error={errors.otherClassIds} />
              <PickSelect
                label={t(`${k}transfer.plan`, { unit: unitName })}
                value={plan}
                onChange={setPlan}
                options={planOptions.map((p) => ({ id: p.id, name: p.valueCents === undefined ? p.name : `${p.name} · ${formatCurrency(p.valueCents)}` }))}
                error={errors.planId}
              />
              {inherited !== undefined ? (
                <p className="text-sm">{t(`${k}transfer.inheritedDay`, { day: inherited })}</p>
              ) : days ? (
                <div className="flex flex-col gap-1">
                  <SegmentedChoice label={t(`${k}transfer.dueDay`)} value={day} onChange={setDay} options={days.map((d) => ({ value: String(d), label: t(`${k}transfer.dayOption`, { day: d }) }))} className="self-start" />
                  <p className="text-xs text-muted-foreground">{t(`${k}transfer.allowedDays`, { unit: unitName })}</p>
                  {errors.dueDay && <p className="text-sm text-danger-foreground">{errors.dueDay}</p>}
                </div>
              ) : (
                <Text label={t(`${k}transfer.dueDayNumber`)} type="number" min={1} max={28} inputMode="numeric" value={day} onChange={setDay} error={errors.dueDay} />
              )}
            </>
          )}
        </>
      )}
    </ModalityDialog>
  );
}
