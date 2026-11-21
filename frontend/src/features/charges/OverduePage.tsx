import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PageHeader } from "@/components/ui/page-header";
import { QueryPage, type Page, type Query } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { useBelowSm } from "@/components/query/useBelowSm";
import { SupportLink } from "@/features/auth/SupportContact";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatCurrency } from "@/lib/format";
import { BlockCell, LastReminder, LateCell, OverdueCard, RowActions, Select, Student, Whatsapp, useOverdueReference, useReminderMessage } from "./OverdueRows";
import { SendReminderDialog } from "./SendReminderDialog";
import type { OverdueCharge } from "./types";
import { fetchOverdue } from "./useOverdue";

const MAX_SEND = 100;

function Content() {
  const { t } = useTranslation();
  const reference = useOverdueReference();
  const message = useReminderMessage();
  const narrow = useBelowSm();
  // A unidade vem da barra: "todas" não filtra. A identidade de fetchPage muda só quando a unidade muda.
  const scope = useUnitScope();
  const unitId = scope.selected && scope.selected !== ALL ? scope.selected : undefined;
  const unitName = scope.units.find((u) => u.id === scope.selected)?.name;
  // A seleção fica na tela (id -> linha, para o resultado citar o aluno) e vale entre páginas; recarregar a lista a zera.
  const [selected, setSelected] = useState<Map<string, OverdueCharge>>(new Map());
  const [pageRows, setPageRows] = useState<OverdueCharge[]>([]);
  const [chosen, setChosen] = useState<string>();
  const [version, setVersion] = useState(0);
  const [sending, setSending] = useState(false);
  const fetchPage = useCallback(
    async (q: Query): Promise<Page<OverdueCharge>> => {
      const page = await fetchOverdue({ ...q, filtros: unitId ? { ...q.filtros, unitId } : q.filtros });
      setPageRows(page.rows);
      return page;
    },
    [unitId],
  );
  const reload = () => setVersion((v) => v + 1);

  const toggle = (row: OverdueCharge) =>
    setSelected((s) => {
      const next = new Map(s);
      if (!next.delete(row.id)) next.set(row.id, row);
      return next;
    });
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected((s) => {
      const next = new Map(s);
      for (const r of pageRows) {
        if (allOnPage) next.delete(r.id);
        else next.set(r.id, r);
      }
      return next;
    });
  const tooMany = selected.size > MAX_SEND;
  const targets = [...selected.values()].map((r) => ({ id: r.id, label: `${r.student.name} · ${reference(r)}` }));
  const preview = pageRows.find((r) => r.id === chosen) ?? pageRows[0];

  const columns: Column<OverdueCharge>[] = [
    { key: "select", label: t("charges.overdue.columns.select"), hideLabel: true, render: (r) => <Select row={r} checked={selected.has(r.id)} onToggle={toggle} /> },
    { key: "student", label: t("charges.overdue.columns.student"), sortable: true, render: (r) => <Student row={r} /> },
    { key: "daysLate", label: t("charges.overdue.columns.daysLate"), sortable: true, render: (r) => <LateCell row={r} /> },
    { key: "amount", label: t("charges.overdue.columns.amount"), sortable: true, numeric: true, render: (r) => <span className="whitespace-nowrap tabular-nums">{formatCurrency(r.amountCents)}</span> },
    { key: "lastReminder", label: t("charges.overdue.columns.lastReminder"), render: (r) => <LastReminder row={r} /> },
    { key: "block", label: t("charges.overdue.columns.block"), render: (r) => <BlockCell row={r} /> },
    {
      key: "actions",
      label: t("charges.overdue.columns.actions"),
      hideLabel: true,
      render: (r) => (
        <span className="flex justify-end gap-2">
          <Whatsapp row={r} />
          <RowActions row={r} onDone={reload} />
        </span>
      ),
    },
  ];

  // Cabeçalho, aviso dos lembretes automáticos e a barra do envio em lote ficam acima da lista.
  const header = ({ counts, total }: { counts?: Record<string, number>; total?: number }) => (
    <>
      <PageHeader
        title={t("charges.overdue.title")}
        subtitle={
          total === undefined
            ? undefined
            : t("charges.overdue.subtitle", {
                scope: unitId && unitName ? t("charges.overdue.scopeUnit", { unit: unitName }) : t("charges.overdue.scopeAll"),
                count: total,
                total: formatCurrency(counts?.totalCents ?? 0),
              })
        }
      />
      <Banner tone="info">
        {t("charges.overdue.notice")}{" "}
        <Link to="/configuracoes/unidade" className="font-medium underline">
          {t("charges.overdue.configure")}
        </Link>
      </Banner>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" className="size-6" checked={allOnPage} disabled={pageRows.length === 0} onChange={toggleAll} />
          {t("charges.overdue.selectAll")}
        </label>
        <span className="text-sm" aria-live="polite">
          {t("charges.overdue.selected", { count: selected.size })}
        </span>
        <Button type="button" className="min-h-11" disabled={selected.size === 0 || tooMany} onClick={() => setSending(true)}>
          {t("charges.overdue.send")}
        </Button>
        {tooMany && <Banner tone="danger">{t("charges.overdue.tooMany")}</Banner>}
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        key={version}
        header={header}
        search={false}
        canvasPagination
        canvasStates
        errorTitle={t("charges.errorTitle")}
        errorText={t("charges.errorText")}
        errorSecondary={<SupportLink />}
        texts={{ emptyTitle: t("charges.overdue.emptyTitle"), emptyText: t("charges.overdue.emptyText") }}
        columns={columns}
        cardsBelow="sm"
        cards={(r) => <OverdueCard row={r} checked={selected.has(r.id)} onToggle={toggle} onDone={reload} />}
        fetchPage={fetchPage}
        rowKey={(r) => r.id}
        onRowClick={(r) => setChosen(r.id)}
      />
      {preview && !narrow && (
        <section aria-labelledby="overdue-message" className="flex flex-col gap-2 rounded-card border border-ok-foreground/30 bg-ok p-4 text-ok-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="overdue-message" className="text-base font-semibold">
              {t("charges.overdue.message.title")}
            </h2>
            <ComingSoon variant="button" label={t("charges.overdue.message.edit")} />
          </div>
          <p className="break-words text-sm">{message(preview)}</p>
        </section>
      )}
      {sending && (
        <SendReminderDialog
          targets={targets}
          onClose={() => setSending(false)}
          onDone={() => {
            setSelected(new Map());
            reload();
          }}
        />
      )}
    </div>
  );
}

// RF-COB-06: cobranças em atraso da gestão, com envio de lembrete em lote; a barreira de dados é o servidor (403 vira "sem permissão" na lista).
export function OverduePage() {
  return <Content />;
}
