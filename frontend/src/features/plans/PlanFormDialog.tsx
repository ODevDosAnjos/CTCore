import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MoneyField } from "@/components/fields/fields";
import { formatMoney } from "@/components/fields/masks";
import { LastChange } from "@/components/LastChange";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { Field, Input, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/features/units/Text";
import { ApiError } from "@/lib/api";
import { createPlan, updatePlan, usePlanDetail, usePlanImpact, usePlanOptions, type PlanDetail, type PlanInput, type PlanOptions, type PlanRow } from "./usePlans";

type FieldName = "unit" | "modality" | "name" | "value" | "frequency" | "form";
type Errors = Partial<Record<FieldName, string>>;
// Campo do servidor -> campo da tela.
const FIELD: Record<string, FieldName> = { unitId: "unit", modalityId: "modality", name: "name", valueCents: "value", weeklyFrequency: "frequency" };
const FORM_ID = "plan-form";

// RF-PLA-03: criação (sem `plan`) e edição do plano. O servidor reconfere tudo (alcance, unicidade do nome, regra de outras unidades).
export function PlanFormDialog({ open, plan, onClose, onSaved, onDeactivate }: { open: boolean; plan?: PlanRow; onClose: () => void; onSaved: (saved: PlanRow) => void; onDeactivate?: (plan: PlanRow) => void }) {
  const { t } = useTranslation();
  const options = usePlanOptions(open);
  const detail = usePlanDetail(open ? plan?.id : undefined);
  if (!open) return null;
  const title = t(plan ? "plans.form.editTitle" : "plans.form.newTitle");
  const statuses = [options.status, plan ? detail.status : "ready"];
  const status = statuses.includes("forbidden") ? "forbidden" : statuses.includes("error") ? "error" : statuses.includes("loading") ? "loading" : "ready";
  if (status !== "ready" || !options.options)
    return (
      <Modal open size="lg" onOpenChange={(o) => !o && onClose()} title={title}>
        {status === "forbidden" && <ForbiddenState />}
        {status === "error" && (
          <ErrorState
            onRetry={() => {
              options.retry();
              detail.retry();
            }}
          />
        )}
        {status === "loading" && <LoadingState />}
      </Modal>
    );
  return <Form key={plan?.id ?? "new"} title={title} options={options.options} plan={plan} detail={detail.detail} onClose={onClose} onSaved={onSaved} onDeactivate={onDeactivate} />;
}

function Form({
  title,
  options,
  plan,
  detail,
  onClose,
  onSaved,
  onDeactivate,
}: {
  title: string;
  options: PlanOptions;
  plan?: PlanRow;
  detail?: PlanDetail;
  onClose: () => void;
  onSaved: (saved: PlanRow) => void;
  onDeactivate?: (plan: PlanRow) => void;
}) {
  const { t } = useTranslation();
  const [unitId, setUnitId] = useState(plan?.unit.id ?? (options.units.length === 1 ? options.units[0].id : ""));
  const unit = options.units.find((u) => u.id === unitId);
  const [modalityId, setModalityId] = useState(plan?.modality.id ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [cents, setCents] = useState<number | null>(plan?.valueCents ?? null);
  const [frequency, setFrequency] = useState(plan ? (plan.weeklyFrequency?.toString() ?? "") : "2");
  const [other, setOther] = useState(plan?.validOtherUnits ?? false);
  const [unpaid, setUnpaid] = useState<"KEEP" | "ADJUST">("KEEP");
  const [paidDifference, setPaidDifference] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const validCents = cents !== null && cents >= 1 && cents <= 99_999_999;
  const valueChanged = !!plan && validCents && cents !== plan.valueCents;
  const impact = usePlanImpact(plan?.id, valueChanged ? cents : null);

  function validate(): Errors {
    const found: Errors = {};
    const n = name.trim();
    if (!plan && !unitId) found.unit = t("plans.form.unitRequired");
    if (!plan && !modalityId) found.modality = t("plans.form.modalityRequired");
    if (n.length < 2 || n.length > 60) found.name = t("plans.form.nameInvalid");
    if (!validCents) found.value = t("plans.form.valueInvalid");
    return found;
  }

  async function submit() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length || cents === null) return;
    const input: PlanInput = {
      name: name.trim(),
      valueCents: cents,
      weeklyFrequency: frequency ? (Number(frequency) as 2 | 3) : null,
      validOtherUnits: options.crossUnitTraining === "plan" && other,
      ...(plan ? (valueChanged ? { unpaidCharges: unpaid, paidFutureDifference: paidDifference } : {}) : { unitId, modalityId }),
    };
    setBusy(true);
    try {
      const saved = plan ? await updatePlan(plan.id, input) : await createPlan(input);
      onClose();
      onSaved(saved);
    } catch (e) {
      const next: Errors = {};
      if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[FIELD[f.field] ?? "form"] = f.message;
      else next.form = t(e instanceof ApiError && e.status === 409 ? "plans.form.conflict" : "plans.form.error");
      setErrors(next);
    } finally {
      setBusy(false);
    }
  }

  const k = "plans.form.";
  const frequencySelect = (
    <Field label={t(`${k}frequency`)} error={errors.frequency}>
      {(c) => (
        <Select {...c} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
          <option value="2">{t(`${k}frequencyOptions.2`)}</option>
          <option value="3">{t(`${k}frequencyOptions.3`)}</option>
          <option value="">{t(`${k}frequencyOptions.free`)}</option>
        </Select>
      )}
    </Field>
  );
  const nameField = <Text label={t(`${k}name`)} required value={name} onChange={setName} error={errors.name} autoComplete="off" />;
  const impactData = impact.impact;

  return (
    <Modal
      open
      size="lg"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={title}
      footer={
        <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2">
          {plan && onDeactivate && (
            <Button type="button" variant="danger" className="min-h-11" disabled={busy} onClick={() => onDeactivate(plan)}>
              {t(`${k}deactivate`)}
            </Button>
          )}
          {plan && <LastChange value={detail?.lastChange ?? null} />}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="min-h-11" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={FORM_ID} className="min-h-11" disabled={busy}>
              {t(plan ? `${k}save` : `${k}create`)}
            </Button>
          </div>
        </div>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        className="flex flex-col gap-4"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        {plan ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t(`${k}unit`)}: {plan.unit.name}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={t(`${k}modality`)}>{(c) => <Input {...c} disabled readOnly value={plan.modality.name} />}</Field>
              {nameField}
              {frequencySelect}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t(`${k}valueCurrent`)}>{(c) => <Input {...c} disabled value={formatMoney(plan.valueCents)} readOnly />}</Field>
              <div className="flex flex-col gap-1">
                <MoneyField label={t(`${k}valueNew`)} required initial={plan.valueCents} onChange={setCents} />
                {errors.value && <p className="text-xs text-danger-foreground">{errors.value}</p>}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t(`${k}unit`)} required error={errors.unit}>
                {(c) => (
                  <Select
                    {...c}
                    value={unitId}
                    onChange={(e) => {
                      setUnitId(e.target.value);
                      setModalityId("");
                    }}
                  >
                    <option value="">{t(`${k}choose`)}</option>
                    {options.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label={t(`${k}modality`)} required error={errors.modality} hint={unit && unit.modalities.length === 0 ? t(`${k}noModalities`) : undefined}>
                {(c) => (
                  <Select {...c} value={modalityId} onChange={(e) => setModalityId(e.target.value)}>
                    <option value="">{t(`${k}choose`)}</option>
                    {(unit?.modalities ?? []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {nameField}
              {frequencySelect}
            </div>
            <div className="flex flex-col gap-1">
              <MoneyField label={t(`${k}valueNewCreate`)} required onChange={setCents} />
              {errors.value && <p className="text-xs text-danger-foreground">{errors.value}</p>}
            </div>
          </>
        )}
        {options.crossUnitTraining === "plan" ? (
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{t(`${k}validOtherUnits`)}</span>
              <span className="text-xs text-muted-foreground">{t(`${k}validOtherUnitsNote`)}</span>
            </div>
            <Switch checked={other} onCheckedChange={setOther} label={t(`${k}validOtherUnits`)} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t(`${k}crossUnit.${options.crossUnitTraining}`)}</p>
        )}
        {valueChanged && (
          <section className="flex flex-col gap-3">
            {impact.status === "loading" && <p role="status">{t(`${k}impact.loading`)}</p>}
            {impact.status === "error" && <Banner tone="danger">{t(`${k}impact.error`)}</Banner>}
            {impactData && <Banner tone="warn">{t(`${k}impact.students`, { count: impactData.studentsAffected })}</Banner>}
            {(impactData?.unpaidCharges ?? 0) > 0 && (
              <ChoiceCards
                legend={t(`${k}impact.unpaid`, { count: impactData?.unpaidCharges })}
                value={unpaid}
                onChange={(v) => setUnpaid(v as "KEEP" | "ADJUST")}
                options={[
                  { value: "KEEP", label: t(`${k}impact.unpaidKeep`) },
                  { value: "ADJUST", label: t(`${k}impact.unpaidAdjust`) },
                ]}
              />
            )}
            {(impactData?.paidFutureCharges ?? 0) > 0 && (
              <ChoiceCards
                legend={t(`${k}impact.paid`, { count: impactData?.paidFutureCharges })}
                value={String(paidDifference)}
                onChange={(v) => setPaidDifference(v === "true")}
                options={[
                  { value: "false", label: t(`${k}impact.paidNone`) },
                  { value: "true", label: t(`${k}impact.paidCharge`), aside: t(`${k}impact.paidAside`) },
                ]}
              />
            )}
            {impactData && <p className="text-xs text-muted-foreground">{t(`${k}impact.note`)}</p>}
          </section>
        )}
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
      </form>
    </Modal>
  );
}
