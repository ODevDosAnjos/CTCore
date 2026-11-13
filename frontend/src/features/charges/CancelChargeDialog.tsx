import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modal";
import { ReasonField } from "@/components/ReasonField";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ChargeRow } from "./types";
import { cancelCharge } from "./useChargeActions";

export type Failure = { fields: Record<string, string>; form: string };
export const FieldError = ({ message }: { message?: string }) => (message ? <p className="text-sm text-danger-foreground">{message}</p> : null);
export const NO_FAILURE: Failure = { fields: {}, form: "" };

// Erro do servidor de uma janela de ação: o 400 vai junto do campo; 409, 404 e o resto viram a mensagem do alto.
export function failureOf(err: unknown, t: (k: string) => string): Failure {
  const e = err instanceof ApiError ? err : null;
  const fields = Object.fromEntries((e?.fields ?? []).map((f) => [f.field, f.message]));
  return { fields, form: e?.fields.length ? "" : t(e?.status === 409 ? "charges.actions.conflict" : e?.status === 404 ? "charges.actions.gone" : "charges.actions.error") };
}

// RN-COB-10: cancela a cobrança em aberto com motivo obrigatório (até 200).
export function CancelChargeDialog({ charge, onClose, onDone }: { charge: ChargeRow; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const formId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Failure>(NO_FAILURE);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !reason.trim()) return;
    setBusy(true);
    setErr(NO_FAILURE);
    try {
      await cancelCharge(charge.id, reason.trim());
      onDone();
      onClose();
    } catch (x) {
      setErr(failureOf(x, t));
    } finally {
      setBusy(false);
    }
  }

  const what = charge.description ?? [charge.modality?.name, charge.referenceMonth && formatDate(charge.referenceMonth).slice(3)].filter(Boolean).join(" · ");
  const kind = charge.type === "ONE_OFF" ? t("charges.cancel.oneOff") : "";
  const line = [charge.student.name, what, kind, formatCurrency(charge.amountCents), t("charges.cancel.due", { due: formatDate(charge.dueOn) })].filter(Boolean).join(" · ");

  return (
    <Modal
      open
      size="sm"
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t("charges.cancel.title")}
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
            {t("common.back")}
          </Button>
          <Button type="submit" form={formId} variant="dangerSolid" className="min-h-11" disabled={busy || !reason.trim()}>
            {t("charges.cancel.submit")}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-3">
        {err.form && <Banner tone="danger">{err.form}</Banner>}
        <SummaryBox label={t("charges.cancel.block")} items={[line]} />
        <ReasonField label={t("charges.actions.reason")} value={reason} onChange={setReason} note={t("charges.cancel.note")} error={err.fields.reason} />
      </form>
    </Modal>
  );
}
