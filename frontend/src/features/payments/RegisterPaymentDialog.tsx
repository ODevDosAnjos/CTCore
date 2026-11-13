import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { Modal } from "@/components/Modal";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { DateField } from "@/components/ui/date-field";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { useSession } from "@/features/auth/SessionProvider";
import { ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PAYMENT_METHODS, receiptStaffPdfUrl, registerPayment, type PaymentMethod, type PaymentReceipt } from "./usePayment";

const MAX_OBSERVATION = 200;
const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** O que a janela mostra da cobrança; `payerEmail` indefinido = o chamador não sabe (o recibo segue o e-mail cadastrado), nulo = sem e-mail cadastrado. */
export interface PayingCharge {
  student: string;
  /** Referência pronta ("Jiu-Jitsu · 03/2026"). */
  label: string;
  dueOn: string;
  unitName?: string;
}

// RF-COB-04: pagamento no balcão (meio, data, observação, recibo por e-mail). O valor é só leitura: o da cobrança.
export function RegisterPaymentDialog({
  chargeId,
  charge,
  amountCents,
  payerEmail,
  onClose,
  onPaid,
}: {
  chargeId: string;
  charge: PayingCharge;
  amountCents: number;
  payerEmail?: string | null;
  onClose: () => void;
  onPaid: (p: PaymentReceipt) => void;
}) {
  const { t } = useTranslation();
  const k = "payments.dialog.";
  const formId = useId();
  const { state } = useSession();
  const who = state.status === "ready" ? state.session.account.name : undefined;
  const today = localDay(new Date());
  const noEmail = payerEmail === null;
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [day, setDay] = useState(today);
  const [observation, setObservation] = useState("");
  const [sendReceipt, setSendReceipt] = useState(!noEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [paid, setPaid] = useState<PaymentReceipt>();

  async function confirm() {
    if (busy) return;
    if (!day || day > today) return setError(t(`${k}dayInvalid`));
    setBusy(true);
    setError(undefined);
    try {
      const done = await registerPayment(chargeId, {
        method,
        amountCents,
        sendReceipt: sendReceipt && !noEmail,
        ...(day === today ? {} : { paidAt: new Date(`${day}T12:00:00`).toISOString() }),
        ...(observation.trim() ? { observation: observation.trim() } : {}),
      });
      setPaid(done);
      onPaid(done);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setError(t(status === 409 ? `${k}notPayable` : status === 400 ? `${k}invalid` : status === 422 ? `${k}amountChanged` : `${k}error`));
    } finally {
      setBusy(false);
    }
  }

  const unit = charge.unitName ? ` · ${t(`${k}receiptOf`, { unit: charge.unitName })}` : "";
  const receiptNote = noEmail ? t(`${k}noEmail`) : `${payerEmail ? t(`${k}receiptTo`, { email: payerEmail }) : t(`${k}receiptToPayer`)}${unit}`;

  return (
    <Modal
      open
      size="sm"
      fullOnMobile
      onOpenChange={(o) => !o && onClose()}
      title={t(`${k}title`)}
      footer={
        paid ? (
          <>
            <Button asChild variant="secondary" className="min-h-11">
              <a href={receiptStaffPdfUrl(paid.receipt.code)} target="_blank" rel="noreferrer">
                {t(`${k}download`)}
              </a>
            </Button>
            <Button type="button" className="min-h-11" onClick={onClose}>
              {t("common.close")}
            </Button>
          </>
        ) : (
          <>
            {who && <span className="mr-auto self-center text-sm text-muted-foreground">{t(`${k}by`, { name: who })}</span>}
            <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={formId} className="min-h-11" disabled={busy}>
              {t(busy ? `${k}sending` : `${k}confirm`)}
            </Button>
          </>
        )
      }
    >
      {paid ? (
        <div className="flex flex-col gap-3">
          <p role="status">{t(`${k}done`)}</p>
          <p>{t(`${k}receiptNumber`, { number: paid.receipt.number })}</p>
          <p>{t(`${k}receiptCode`, { code: paid.receipt.code })}</p>
          {paid.receiptEmail && paid.receiptEmail !== "NOT_REQUESTED" && <p>{t(`${k}email.${paid.receiptEmail}`)}</p>}
        </div>
      ) : (
        <form
          id={formId}
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <SummaryBox
            label={t(`${k}block`)}
            items={[t(`${k}chargeLine`, { student: charge.student, label: charge.label, due: formatDate(charge.dueOn) }), t(`${k}valueLine`, { value: formatMoney(amountCents) })]}
          />
          <ChoiceCards
            legend={t(`${k}method`)}
            columns={2}
            value={method}
            onChange={(v) => setMethod(v as PaymentMethod)}
            options={PAYMENT_METHODS.map((m) => ({ value: m, label: t(`${k}methods.${m}`) }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="payment-day" label={t(`${k}day`)}>
              {(c) => <DateField {...c} iconLeft value={day} max={today} onChange={(e) => setDay(e.target.value)} />}
            </Field>
            <Field id="payment-amount" label={t(`${k}amount`)} hint={t(`${k}amountHint`)}>
              {(c) => <Input {...c} value={formatMoney(amountCents)} disabled readOnly />}
            </Field>
          </div>
          <Field id="payment-observation" label={t(`${k}observation`)}>
            {(c) => (
              <>
                <Textarea {...c} rows={2} value={observation} onChange={(e) => setObservation(e.target.value.slice(0, MAX_OBSERVATION))} aria-describedby="payment-observation-count" />
                <p id="payment-observation-count" className="text-xs text-muted-foreground">
                  {t(`${k}observationCount`, { count: observation.length, max: MAX_OBSERVATION })}
                </p>
              </>
            )}
          </Field>
          <div className="flex flex-col">
            <Checkbox label={t(`${k}sendReceipt`)} checked={sendReceipt && !noEmail} disabled={noEmail} aria-describedby="payment-receipt-note" onChange={(e) => setSendReceipt(e.target.checked)} />
            <p id="payment-receipt-note" className="pl-6 text-xs text-muted-foreground">
              {receiptNote}
            </p>
          </div>
          {error && <Banner tone="danger">{error}</Banner>}
        </form>
      )}
    </Modal>
  );
}
