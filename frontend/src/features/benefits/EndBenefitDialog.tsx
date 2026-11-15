import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { Modal } from "@/components/Modal";
import { ReasonField } from "@/components/ReasonField";
import { EmptyState, ErrorState, ForbiddenState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { monthLabel, previousMonthLabel, untilMonth, valueText } from "./benefitFormat";
import type { BenefitRow } from "./useBenefits";
import { endBenefit } from "./useGrantBenefit";

type Outcome = "form" | "error" | "forbidden" | "gone";

// RF-BEN-03: encerrar o benefício com motivo. O servidor decide (400 no campo, 403, 409 se já encerrado por outra pessoa); a barreira é dele.
export function EndBenefitDialog({ benefit, onClose, onDone }: { benefit: BenefitRow; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "benefits.end.";
  const formId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("form");
  const [fieldError, setFieldError] = useState<string>();
  const canSubmit = reason.trim().length >= 2 && !busy;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setFieldError(undefined);
    try {
      await endBenefit(benefit.id, reason.trim());
      onDone();
      onClose();
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 400 && err instanceof ApiError && err.fields.length) setFieldError(err.fields[0].message);
      else if (status === 403) setOutcome("forbidden");
      else if (status === 409) {
        setOutcome("gone");
        onDone();
      } else setOutcome("error");
    } finally {
      setBusy(false);
    }
  }

  const base = t(benefit.type === "PERCENT" ? `${k}summaryPercent` : `${k}summaryAmount`, { student: benefit.student.name, modality: benefit.modality.name, value: valueText(benefit) });
  const summary = benefit.validUntil ? t(`${k}summaryUntil`, { summary: base, month: untilMonth(benefit.validUntil) }) : t(`${k}summaryNoDeadline`, { summary: base });

  return (
    <Modal
      open
      size="sm"
      scrim="canvas"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t(`${k}title`)}
      footer={
        outcome === "form" ? (
          <>
            <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
              {t(`${k}back`)}
            </Button>
            <Button type="submit" form={formId} variant="dangerSolid" className="min-h-11" disabled={!canSubmit}>
              {t(`${k}submit`)}
            </Button>
          </>
        ) : undefined
      }
    >
      {outcome === "forbidden" && <ForbiddenState />}
      {outcome === "error" && <ErrorState onRetry={() => setOutcome("form")} />}
      {outcome === "gone" && <EmptyState title={t(`${k}goneTitle`)} text={t(`${k}goneText`)} action={<Button type="button" className="min-h-11" onClick={onClose}>{t("common.close")}</Button>} />}
      {outcome === "form" && (
        <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-3">
          <SummaryBox label={t(`${k}block`)} items={[summary]} />
          <ReasonField
            label={t(`${k}reason`)}
            value={reason}
            onChange={setReason}
            error={fieldError}
            rows={1}
            note={t(`${k}note`, { next: monthLabel(benefit.nextChargeMonth), value: formatMoney(benefit.planValueCents), previous: previousMonthLabel(benefit.nextChargeMonth) })}
          />
        </form>
      )}
    </Modal>
  );
}
