import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Receipt } from "lucide-react";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Stat } from "@/components/ui/stat";
import { StatusBadge, useReference } from "@/features/charges/ChargeCards";
import { ChargePanel } from "@/features/charges/ChargePanel";
import type { ChargeList, ChargeRow } from "@/features/charges/types";
import { RegisterPaymentDialog } from "@/features/payments/RegisterPaymentDialog";
import { DEFAULT_TZ, formatCurrency, formatDate } from "@/lib/format";
import { daysLate, group, isPaid, isPayable, summarize } from "./studentFinancialSummary";

const GROUPS = ["open", "paid", "other"] as const;
type Charges = { status: string; data?: ChargeList; reload: () => void };

// Situação financeira do cabeçalho (R14): Em atraso se alguma cobrança está em atraso, senão Em dia.
export const isOverdue = (data?: ChargeList) => !!data?.items.some((c) => c.status === "OVERDUE");

// RF-COB-02, R14: cartões de resumo, nota, "Nova cobrança avulsa" e as cobranças do aluno (tabela; cartões em dois grupos no celular).
export function StudentFinancialTab({ charges, onChanged, onCharge }: { charges: Charges; onChanged: () => void; onCharge?: () => void }) {
  const { t } = useTranslation();
  const k = "students.record.financial.";
  const reference = useReference();
  const narrow = useBelowSm();
  const [open, setOpen] = useState<string>();
  const [paying, setPaying] = useState<ChargeRow>();
  const [paid, setPaid] = useState(false);
  if (charges.status === "loading" || charges.status === "idle") return <LoadingState />;
  if (charges.status === "forbidden") return <ForbiddenState />;
  if (charges.status !== "ready" || !charges.data) return <ErrorState onRetry={charges.reload} />;
  const items = charges.data.items;
  const now = new Date();
  const s = summarize(items, now);
  const short = (iso: string) => formatDate(iso, DEFAULT_TZ).slice(0, 5);
  const action = (c: ChargeRow) => {
    const key = isPaid(c) ? "receipt" : isPayable(c) ? "pay" : "open";
    const label = t(`${k}actions.${key}`);
    return (
      <Button type="button" size="sm" variant="secondary" aria-label={t(`${k}actionOf`, { action: label, reference: reference(c) })} onClick={() => (key === "pay" ? setPaying(c) : setOpen(c.id))}>
        {label}
      </Button>
    );
  };
  const columns: Column<ChargeRow>[] = [
    { key: "reference", label: t(`${k}columns.reference`), render: (c) => <span className="font-medium">{reference(c)}</span> },
    { key: "due", label: t(`${k}columns.due`), render: (c) => formatDate(c.dueOn) },
    { key: "amount", label: t(`${k}columns.amount`), numeric: true, render: (c) => formatCurrency(c.amountCents) },
    { key: "status", label: t(`${k}columns.status`), render: (c) => <StatusBadge status={c.status} /> },
    { key: "action", label: t(`${k}columns.action`), render: action },
  ];
  const meta = (c: ChargeRow) =>
    c.payment
      ? t(`${k}paidOn`, { method: t(`payments.method.${c.payment.method}`), date: short(c.payment.paidAt) })
      : c.status === "OVERDUE"
        ? t(`${k}dueLate`, { date: short(c.dueOn), days: t(`${k}days`, { count: daysLate(c, now) }) })
        : t(`${k}dueOn`, { date: short(c.dueOn) });
  const card = (c: ChargeRow) => (
    <li key={c.id} className="rounded-card border bg-card p-3">
      <RowCard title={<span className="font-heading text-lg font-semibold">{formatCurrency(c.amountCents)}</span>} meta={<><span>{reference(c)}</span><span>{meta(c)}</span></>} badge={<StatusBadge status={c.status} />} action={action(c)} />
    </li>
  );
  const groups = group(items);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label={t(`${k}open`)} value={formatCurrency(s.open.cents)} note={t(`${k}charges`, { count: s.open.count })} />
        <Stat
          label={t(`${k}late`)}
          value={formatCurrency(s.overdue.cents)}
          tone={s.overdue.count ? "danger" : "neutral"}
          note={[t(`${k}charges`, { count: s.overdue.count }), s.overdue.count > 0 && t(`${k}days`, { count: s.overdue.days })].filter(Boolean).join(" · ")}
        />
        <Stat label={t(`${k}paidYear`, { year: s.paid.year })} value={formatCurrency(s.paid.cents)} tone="ok" note={t(`${k}payments`, { count: s.paid.count })} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">{t(`${k}note`)}</p>
        {onCharge && (
          <Button type="button" variant="secondary" icon={<Receipt aria-hidden="true" />} onClick={onCharge}>
            {t(`${k}newCharge`)}
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState title={t(`${k}emptyTitle`)} text={t(`${k}emptyText`)} />
      ) : narrow ? (
        GROUPS.map(
          (g) =>
            groups[g].length > 0 && (
              <section key={g} aria-labelledby={`fin-${g}`} className="flex flex-col gap-2">
                <h3 id={`fin-${g}`} className="text-sm font-semibold">{t(`${k}groups.${g}`)}</h3>
                <ul className="flex flex-col gap-2">{groups[g].map(card)}</ul>
              </section>
            ),
        )
      ) : (
        <DataTable columns={columns} rows={items} rowKey={(c) => c.id} order="" onOrder={() => {}} />
      )}
      {open && (
        <ChargePanel
          id={open}
          studentLink={false}
          onClose={() => setOpen(undefined)}
          onChanged={() => {
            charges.reload();
            onChanged();
          }}
        />
      )}
      {paying && (
        <RegisterPaymentDialog
          chargeId={paying.id}
          label={reference(paying)}
          amountCents={paying.amountCents}
          onPaid={() => setPaid(true)}
          onClose={() => {
            setPaying(undefined);
            if (paid) {
              setPaid(false);
              charges.reload();
              onChanged();
            }
          }}
        />
      )}
    </div>
  );
}
