import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoon } from "@/components/ui/coming-soon";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { PixProofDialog } from "./PixProofDialog";
import type { FinanceCharge } from "./usePortalFinance";

type Props = { items: FinanceCharge[]; showStudent: boolean; onChanged: () => void };

// RF-POR-05, RN-POR-02: cobranças em aberto (vencidas primeiro, ordem do servidor) em tabela com seleção. A barra "N selecionadas" manda
// o Pix na chave com comprovante (real) ou "Pagar" (Em breve, Sprint 11). Só da mesma unidade; em conferência não se marca (RN-COB-13).
function Group({ items, showStudent, onChanged }: Props) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const [picked, setPicked] = useState<string[]>([]);
  const [paying, setPaying] = useState<string[]>();
  const chosen = items.filter((c) => c.canPay && picked.includes(c.id));
  const mixed = new Set(chosen.map((c) => c.unit.id)).size > 1;
  const total = formatCurrency(chosen.reduce((n, c) => n + c.amountCents, 0));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const what = (c: FinanceCharge) => (showStudent ? `${c.referenceLabel} · ${c.studentName}` : c.referenceLabel);
  const box = (c: FinanceCharge) =>
    c.canPay ? <Checkbox aria-label={t("portalFinance.open.select", { what: what(c) })} checked={picked.includes(c.id)} onChange={() => toggle(c.id)} /> : null;
  const badge = (c: FinanceCharge) => <StatusBadge status={c.situation} label={t(`portalFinance.open.situation.${c.situation}`)} />;

  const columns: Column<FinanceCharge>[] = [
    { key: "select", label: t("portalFinance.open.columns.select"), hideLabel: true, render: box },
    {
      key: "charge",
      label: t("portalFinance.open.columns.charge"),
      render: (c) => (
        <div className="flex flex-col">
          <span className="break-words font-medium">{c.referenceLabel}</span>
          {showStudent && <span className="break-words text-muted-foreground">{c.studentName}</span>}
        </div>
      ),
    },
    { key: "due", label: t("portalFinance.open.columns.due"), render: (c) => formatDate(c.dueOn) },
    { key: "amount", label: t("portalFinance.open.columns.amount"), numeric: true, render: (c) => formatCurrency(c.amountCents) },
    { key: "situation", label: t("portalFinance.open.columns.situation"), render: badge },
  ];

  return (
    <div className="flex flex-col gap-3">
      {narrow ? (
        <ul className="flex flex-col divide-y">
          {items.map((c) => (
            <li key={c.id} className="py-3">
              <RowCard
                lead={box(c)}
                title={c.referenceLabel}
                meta={
                  <>
                    {showStudent && <span className="break-words">{c.studentName}</span>}
                    <span>{t(c.situation === "OVERDUE" ? "portalFinance.open.dueShortPast" : "portalFinance.open.dueShort", { date: formatDate(c.dueOn).slice(0, 5) })}</span>
                  </>
                }
                badge={badge(c)}
                action={<span className="font-medium">{formatCurrency(c.amountCents)}</span>}
              />
            </li>
          ))}
        </ul>
      ) : (
        <DataTable columns={columns} rows={items} rowKey={(c) => c.id} order="" onOrder={() => {}} />
      )}
      {chosen.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md bg-surface-soft p-3">
          <p role="status" className="font-medium">
            {t("portalFinance.open.selected", { count: chosen.length, value: total })}
          </p>
          {mixed && (
            <p role="alert" className="text-sm text-danger-foreground">
              {t("portalFinance.open.mixedUnits")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button className="min-h-11" disabled={mixed} onClick={() => setPaying(chosen.map((c) => c.id))}>
              {t("portalFinance.open.sendProof")}
            </Button>
            <ComingSoon variant="button" label={t("portalFinance.open.payAmount", { value: total })} />
          </div>
        </div>
      )}
      {paying && (
        <PixProofDialog
          chargeIds={paying}
          description={items.filter((c) => paying.includes(c.id)).map((c) => c.referenceLabel).join(" e ")}
          onClose={() => setPaying(undefined)}
          onSent={() => {
            setPicked([]);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

export function PortalOpenCharges({ items, showStudent, onChanged }: Props) {
  const { t } = useTranslation();
  // Na visão da família o pagamento é por unidade: um grupo (com resumo e botões) para cada uma.
  const units = showStudent ? [...new Map(items.map((c) => [c.unit.id, c.unit])).values()] : [];
  return (
    <Card heading="h2" titleClassName="text-2xl uppercase" title={t("portalFinance.open.title")}>
      {items.length === 0 ? (
        <EmptyState title={t("portalFinance.open.emptyTitle")} text={t("portalFinance.open.emptyText")} />
      ) : units.length > 1 ? (
        <div className="flex flex-col gap-6">
          {units.map((u) => (
            <section key={u.id} aria-label={t("portalFinance.open.unit", { unit: u.name })} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">{t("portalFinance.open.unit", { unit: u.name })}</h3>
              <Group items={items.filter((c) => c.unit.id === u.id)} showStudent={showStudent} onChanged={onChanged} />
            </section>
          ))}
        </div>
      ) : (
        <Group items={items} showStudent={showStudent} onChanged={onChanged} />
      )}
    </Card>
  );
}
