import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { valueText } from "./benefitFormat";
import type { BenefitRow } from "./useBenefits";

type Side = { type: "PERCENT" | "AMOUNT"; value: number; reason: string; validUntil: string | null };

// RN-BEN-08: confirmação "Substituir benefício?" com o benefício atual e o novo lado a lado. "Manter o atual" só fecha esta janela (nada é gravado);
// "Substituir" grava com replaceExisting. 403 e erro mostram o estado na janela e nada fecha.
export function ReplaceBenefitDialog({
  student,
  modality,
  current,
  next,
  newMonthlyCents,
  onConfirm,
  onKeep,
  onDone,
}: {
  student: string;
  modality: string;
  current: BenefitRow;
  next: Side;
  newMonthlyCents: number;
  onConfirm: () => Promise<unknown>;
  onKeep: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const k = "benefits.replace.";
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<"form" | "forbidden" | "error">("form");

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      onDone();
    } catch (err) {
      setOutcome(err instanceof ApiError && err.status === 403 ? "forbidden" : "error");
    } finally {
      setBusy(false);
    }
  }

  const card = (title: string, side: Side) => (
    <section aria-label={title} className="flex min-w-0 flex-col gap-2 rounded-card border bg-card p-3 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <dl className="flex flex-col gap-1">
        {[
          [t(`${k}type`), t(`${k}types.${side.type}`)],
          [t(`${k}value`), valueText(side)],
          [t(`${k}reason`), side.reason],
          [t(`${k}validUntil`), side.validUntil ? t("benefits.until", { month: formatDate(side.validUntil) }) : t(`${k}noDeadline`)],
        ].map(([label, text]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="break-words font-medium">{text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
  const first = student.split(" ")[0];

  return (
    <Modal
      open
      size="sm"
      scrim="canvas"
      onOpenChange={(o) => !o && !busy && onKeep()}
      title={t(`${k}title`)}
      footer={
        outcome === "form" ? (
          <>
            <Button type="button" variant="ghost" className="min-h-11" onClick={onKeep}>
              {t(`${k}keep`)}
            </Button>
            <Button type="button" className="min-h-11" disabled={busy} onClick={confirm}>
              {t(`${k}submit`)}
            </Button>
          </>
        ) : undefined
      }
    >
      {outcome === "forbidden" && <ForbiddenState />}
      {outcome === "error" && <ErrorState onRetry={() => setOutcome("form")} />}
      {outcome === "form" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t(`${k}subtitle`, { student, modality })}</p>
          <p className="text-sm">{t(`${k}text`, { student: first, modality })}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {card(t(`${k}current`), current)}
            {card(t(`${k}next`), next)}
          </div>
          <SummaryBox
            label={t(`${k}summary`)}
            items={[t(`${k}newReplaces`, { next: formatMoney(newMonthlyCents), current: formatMoney(current.monthlyValueCents) }), t(`${k}historyNote`)]}
          />
        </div>
      )}
    </Modal>
  );
}
