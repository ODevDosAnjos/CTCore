import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState } from "@/components/states";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { portalReceiptUrl, type FinanceHistoryItem } from "./usePortalFinance";

type Props = { items: FinanceHistoryItem[]; year: number; years: number[]; onYear: (year: number) => void; /** Portal reduzido: só o que foi pago, em Referência, Pago em, Valor e Recibo (canvas PortalReduzido). */ reduced?: boolean };

// RF-POR-05: histórico por ano (abas) com meio, data e "Recibo" (ícone) nas pagas; no celular, linhas compactas.
export function PortalChargeHistory({ items: all, year, years, onYear, reduced }: Props) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const items = reduced ? all.filter((h) => h.status === "PAID") : all;
  const options = years.includes(year) ? years : [year, ...years];
  const method = (h: FinanceHistoryItem) => (h.method ? t(`payments.method.${h.method}`) : "—");
  const paidOn = (h: FinanceHistoryItem) => (h.paidAt ? formatDate(h.paidAt) : "—");
  const receipt = (h: FinanceHistoryItem) =>
    h.receipt && (
      <a
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md hover:bg-surface-soft"
        href={portalReceiptUrl(h.receipt.code)}
        target="_blank"
        rel="noreferrer"
        aria-label={t("portalFinance.history.receiptItem", { what: h.referenceLabel })}
      >
        <Download aria-hidden="true" className="size-4" />
        {!narrow && <span className="ml-2 text-sm">{t("portalFinance.history.columns.receipt")}</span>}
      </a>
    );
  const badge = (h: FinanceHistoryItem) => <StatusBadge status={h.status} label={t(`portalFinance.history.status.${h.status}`)} />;
  const c = (key: string, render: Column<FinanceHistoryItem>["render"], numeric?: boolean): Column<FinanceHistoryItem> => ({ key, label: t(`portalFinance.history.columns.${key}`), render, numeric });
  const columns: Column<FinanceHistoryItem>[] = [
    c("reference", (h) => <span className="break-words font-medium">{h.referenceLabel}</span>),
    c("due", (h) => formatDate(h.dueOn)),
    c("amount", (h) => formatCurrency(h.amountCents), true),
    c("paidAt", paidOn),
    c("method", method),
    c("situation", badge),
    { key: "receipt", label: t("portalFinance.history.columns.receipt"), render: (h) => receipt(h) || null },
  ];
  const shownColumns = reduced ? [columns[0], columns[3], { ...columns[2], label: t("portalFinance.history.columns.amountShort") }, columns[6]] : columns;

  const list =
    items.length === 0 ? (
      <EmptyState title={t("portalFinance.history.emptyTitle")} text={t("portalFinance.history.emptyText")} />
    ) : narrow ? (
      <ul className="flex flex-col divide-y">
        {items.map((h) => (
          <li key={h.id} className="py-3">
            <RowCard
              title={h.referenceLabel}
              meta={<span>{reduced ? t("portalFinance.history.paidOnShort", { date: paidOn(h).slice(0, 5) }) : h.paidAt ? `${method(h)} · ${formatDate(h.paidAt).slice(0, 5)}` : t(`portalFinance.history.status.${h.status}`)}</span>}
              action={
                <span className="flex items-center gap-1">
                  <span className="font-medium">{formatCurrency(h.amountCents)}</span>
                  {receipt(h)}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    ) : (
      <DataTable columns={shownColumns} rows={items} rowKey={(h) => h.id} order="" onOrder={() => {}} />
    );

  return (
    <Card heading="h2" titleClassName={reduced ? CARD_TITLE : "text-2xl uppercase"} title={t(reduced ? (narrow ? "portalFinance.history.reducedTitleShort" : "portalFinance.history.reducedTitle") : "portalFinance.history.title")}>
      <Tabs
        label={t("portalFinance.history.year")}
        value={String(year)}
        onValueChange={(y) => onYear(Number(y))}
        tabs={options.map((y) => ({ id: String(y), label: String(y), content: list }))}
      />
    </Card>
  );
}
