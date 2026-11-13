import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { MoneyField } from "@/components/fields/fields";
import { Modal } from "@/components/Modal";
import { ReasonField } from "@/components/ReasonField";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { DateField } from "@/components/ui/date-field";
import { Field, Select } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { formatCurrency, formatDate } from "@/lib/format";
import { failureOf, NO_FAILURE, type Failure } from "./CancelChargeDialog";
import { todayIso } from "./ChangeDueDialog";
import type { ChargeRow } from "./types";
import { renegotiateCharges } from "./useChargeActions";
import { useReference } from "./ChargeCards";

const TH = "px-3 py-2 text-left text-xs font-semibold text-muted-foreground";
const TD = "px-3 py-2.5";
const MAX = 6;

// Parcelas mensais a partir de `first` (dia mantido, limitado ao último dia do mês); o resto dos centavos vai para a primeira (RN-COB-09).
export function previewInstallments(total: number, n: number, first: string) {
  const [y, m, d] = first.split("-").map(Number);
  const base = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => {
    const month = new Date(Date.UTC(y, m - 1 + i, 1));
    const last = new Date(Date.UTC(y, m + i, 0)).getUTCDate();
    const dueOn = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
    return { amountCents: i === 0 ? total - base * (n - 1) : base, dueOn };
  });
}

// RN-COB-09: renegocia uma cobrança em aberto: novo valor e vencimento (1 parcela) ou dividida em 2 a 6 parcelas mensais do mesmo total.
export function RenegotiateDialog({ charge, onClose, onDone }: { charge: ChargeRow; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation();
  const k = "charges.renegotiate.";
  const formId = useId();
  const narrow = useBelowSm();
  const reference = useReference();
  const original = charge.amountCents;
  const [total, setTotal] = useState<number | null>(original);
  const [firstDueOn, setFirstDueOn] = useState("");
  const [installments, setInstallments] = useState(1);
  const [how, setHow] = useState<"single" | "split">("single");
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Failure>(NO_FAILURE);
  const amount = installments === 1 ? total : original;
  const past = !!firstDueOn && firstDueOn < todayIso();
  const missing = {
    firstDueOn: !firstDueOn ? t(`${k}errors.firstDueOn`) : past ? t(`${k}errors.past`) : undefined,
    amount: !amount || amount < installments ? t(`${k}errors.amount`) : undefined,
    reason: !reason.trim() ? t(`${k}errors.reason`) : undefined,
  };
  const valid = !missing.firstDueOn && !missing.amount && !missing.reason;
  const rows = amount && firstDueOn ? previewInstallments(amount, installments, firstDueOn) : [];
  const first = charge.student.name.split(" ")[0];
  const modality = charge.modality?.name ?? t(`charges.types.${charge.type}`);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (busy || !valid) return;
    setBusy(true);
    setErr(NO_FAILURE);
    try {
      await renegotiateCharges({ chargeIds: [charge.id], ...(amount !== original ? { amountCents: amount! } : {}), firstDueOn, installments, reason: reason.trim() });
      onDone();
      onClose();
    } catch (x) {
      setErr(failureOf(x, t));
    } finally {
      setBusy(false);
    }
  }

  const split = (n: number) => t(`${k}splitOption`, { n, amount: formatCurrency(Math.floor(original / n)) });
  return (
    <Modal
      open
      size="md"
      fullOnMobile
      onOpenChange={(o) => !o && !busy && onClose()}
      title={t(`${k}title`)}
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId} className="min-h-11" disabled={busy || !valid}>
            {t(`${k}submit`)}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{t(`${k}effect`)}</p>
        {err.form && <Banner tone="danger">{err.form}</Banner>}
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm" aria-label={t(`${k}chosen`)}>
            <thead className="bg-surface-soft">
              <tr>
                <th scope="col" className={TH}>
                  {t(`${k}chosen`)}
                </th>
                <th scope="col" className={TH}>
                  {t(`${k}dueOn`)}
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  {t(`${k}value`)}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              <tr>
                <td className={`${TD} break-words`}>{t(`${k}original`, { student: charge.student.name, reference: reference(charge) })}</td>
                <td className={`${TD} whitespace-nowrap`}>{formatDate(charge.dueOn)}</td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{formatCurrency(original)}</td>
              </tr>
              <tr className="bg-surface-soft font-semibold">
                <td className={TD} colSpan={2}>
                  {t(`${k}totalRow`)}
                </td>
                <td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{formatCurrency(original)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {narrow && (
          <ChoiceCards
            legend={t(`${k}how`)}
            value={how}
            onChange={(v) => {
              setHow(v as "single" | "split");
              setInstallments(v === "single" ? 1 : 2);
            }}
            options={[
              { value: "single", label: t(`${k}howSingle`) },
              { value: "split", label: t(`${k}howSplit`) },
            ]}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {(!narrow || how === "split") && (
            <Field label={t(`${k}installments`)}>
              {(c) => (
                <Select {...c} value={String(installments)} onChange={(e) => setInstallments(Number(e.target.value))}>
                  {Array.from({ length: MAX }, (_, i) => i + 1)
                    .filter((n) => !narrow || n > 1)
                    .map((n) => (
                      <option key={n} value={n}>
                        {narrow ? split(n) : n === 1 ? t(`${k}single`) : t(`${k}parcels`, { n })}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
          )}
          <Field label={t(`${k}firstDueOn`)} required error={(tried || past) && missing.firstDueOn ? missing.firstDueOn : err.fields.firstDueOn}>
            {(c) => <DateField {...c} iconLeft min={todayIso()} value={firstDueOn} onChange={(e) => setFirstDueOn(e.target.value)} />}
          </Field>
        </div>
        {installments === 1 && (
          <div>
            <MoneyField label={t(`${k}newValue`)} initial={total ?? original} onChange={setTotal} required />
            {tried && missing.amount && <p className="text-xs text-danger-foreground">{missing.amount}</p>}
          </div>
        )}
        {err.fields.amountCents && <p className="text-xs text-danger-foreground">{err.fields.amountCents}</p>}
        {err.fields.installments && <p className="text-xs text-danger-foreground">{err.fields.installments}</p>}

        {rows.length > 0 && (
          <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-sm" aria-label={t(`${k}preview`)}>
              <thead className="bg-surface-soft">
                <tr>
                  <th scope="col" className={TH}>
                    {t(`${k}parcel`)}
                  </th>
                  <th scope="col" className={TH}>
                    {t(`${k}dueOn`)}
                  </th>
                  <th scope="col" className={`${TH} text-right`}>
                    {t(`${k}value`)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className={TD}>{t(`${k}line`, { n: i + 1, total: installments })}</td>
                    <td className={TD}>{formatDate(r.dueOn)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{formatCurrency(r.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ReasonField rows={1} label={t("charges.actions.reason")} value={reason} onChange={setReason} error={(tried && missing.reason) || err.fields.reason || undefined} />
        <SummaryBox
          label={t(`${k}summary`)}
          items={[t(`${k}summaryOriginal`), t(`${k}summaryBlock`, { modality }), t(`${k}summaryPortal`, { name: first })]}
        />
      </form>
    </Modal>
  );
}
