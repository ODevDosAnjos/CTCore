import { useCallback, useState } from "react";
import { CalendarClock, Plus, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { QueryPage, type Page, type Query } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { useBelowSm } from "@/components/query/useBelowSm";
import { useQueryParams } from "@/components/query/useQueryParams";
import { SupportLink } from "@/features/auth/SupportContact";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { usePermissions } from "@/features/permissions/usePermissions";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ChargeRow } from "./types";
import { ChargeCard, ChargeStudent, MethodCell, ReferenceCell, StatusCell, useReference } from "./ChargeCards";
import { ChargeFilters } from "./ChargeFilters";
import { ChargePanel } from "./ChargePanel";
import { ChargeRowMenu } from "./ChargeRowMenu";
import { OneOffChargeDialog } from "./OneOffChargeDialog";
import { periodLabel } from "./period";
import { fetchCharges } from "./useCharges";
import { PageHeader } from "@/components/ui/page-header";

const FILTER_KEYS = ["quick", "period", "status", "type", "modalityId", "classId"];

function Content() {
  const { t } = useTranslation();
  // O painel vive no endereço (?cobranca=); depois de cancelar ou renegociar a lista é recarregada.
  const { get, set } = useQueryParams();
  const narrow = useBelowSm();
  const reference = useReference();
  const [version, setVersion] = useState(0);
  const [creating, setCreating] = useState(false);
  // RF-COB-07: "Nova cobrança" só para quem tem cobranças completo; o servidor segue sendo a barreira.
  const canCreate = usePermissions().permissions?.COLLECTIONS === "FULL";
  // A unidade vem da barra: "todas" não filtra. A identidade de fetchPage muda só quando a unidade muda.
  const scope = useUnitScope();
  const unitId = scope.selected && scope.selected !== ALL ? scope.selected : undefined;
  const unitName = scope.units.find((u) => u.id === scope.selected)?.name;
  const fetchPage = useCallback((q: Query) => fetchCharges(q, unitId), [unitId]);
  const reload = () => setVersion((v) => v + 1);
  const open = (id: string) => set({ cobranca: id });
  const id = get("cobranca");
  const quick = get("quick");
  const create = (
    <Button className={narrow ? "min-h-11 w-full" : "min-h-11"} onClick={() => setCreating(true)}>
      <Plus aria-hidden="true" />
      {t("charges.creation.open")}
    </Button>
  );
  const header = ({ total }: { counts?: Record<string, number>; total?: number }) => {
    if (narrow) {
      const period = get("period");
      const month = periodLabel(period || new Date().toISOString().slice(0, 7));
      return <PageHeader title={t("charges.title")} subtitle={total === undefined ? month : t("charges.mobileSubtitle", { month, count: total })} />;
    }
    return (
      <PageHeader
        title={t("charges.title")}
        subtitle={unitId && unitName ? t("charges.subtitle", { unit: unitName }) : t("charges.subtitleAll")}
        actions={
          <>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/cobrancas/recebimentos">
                <Wallet aria-hidden="true" />
                {t("charges.daily.open")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/cobrancas/previa">
                <CalendarClock aria-hidden="true" />
                {t("charges.preview.open")}
              </Link>
            </Button>
            <ComingSoon variant="button" label={t("charges.export")} />
            {canCreate && create}
          </>
        }
      />
    );
  };
  const columns: Column<ChargeRow>[] = [
    { key: "student", label: t("charges.columns.student"), sortable: true, render: (r) => <ChargeStudent row={r} /> },
    { key: "reference", label: t("charges.columns.reference"), render: (r) => <ReferenceCell row={r} onOpen={open} /> },
    { key: "amount", label: t("charges.columns.amount"), sortable: true, numeric: true, render: (r) => formatCurrency(r.amountCents) },
    { key: "dueOn", label: t("charges.columns.dueOn"), sortable: true, render: (r) => formatDate(r.dueOn) },
    { key: "status", label: t("charges.columns.status"), render: (r) => <StatusCell row={r} /> },
    { key: "method", label: t("charges.columns.method"), render: (r) => <MethodCell row={r} /> },
    {
      key: "actions",
      label: t("charges.columns.actions"),
      hideLabel: true,
      render: (r) => <ChargeRowMenu row={r} label={t("charges.menu.label", { student: r.student.name, reference: reference(r) })} onOpen={() => open(r.id)} onDone={reload} />,
    },
  ];
  // Rodapé: "N de T cobranças", a soma do filtro e Pago / Em aberto (todos do filtro, não só da página). No celular, só na aba Em atraso.
  const footer = (page: Page<ChargeRow>) => {
    const c = page.counts;
    const sum = formatCurrency(c?.totalCents ?? 0);
    if (narrow)
      return quick === "OVERDUE" ? (
        <p className="flex items-center justify-between rounded-md border bg-card px-4 py-3 text-sm font-medium">
          <span>{t("charges.footerLate", { count: c?.totalCount ?? page.total })}</span>
          <span className="tabular-nums">{sum}</span>
        </p>
      ) : null;
    return (
      <p className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-md bg-surface-soft px-3 py-2 text-sm font-medium">
        <span>{t("charges.footer", { count: page.rows.length, total: c?.totalCount ?? page.total })}</span>
        <span className="tabular-nums">{sum}</span>
        <span className="tabular-nums">{t("charges.footerPaidOpen", { paid: formatCurrency(c?.paidCents ?? 0), open: formatCurrency(c?.openCents ?? 0) })}</span>
      </p>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        key={version}
        header={header}
        search={!narrow}
        searchPlaceholder={t("charges.search")}
        canvasPagination
        canvasStates
        errorTitle={t("charges.errorTitle")}
        errorText={t("charges.errorText")}
        errorSecondary={<SupportLink />}
        columns={columns}
        cardsBelow="sm"
        cards={(r) => <ChargeCard row={r} onOpen={open} />}
        fetchPage={fetchPage}
        rowKey={(r) => r.id}
        onRowClick={(r) => open(r.id)}
        filterKeys={FILTER_KEYS}
        filters={(p) => <ChargeFilters {...p} />}
        footer={footer}
      />
      {canCreate && narrow && create}
      {id && <ChargePanel id={id} onClose={() => set({ cobranca: "" })} onChanged={reload} />}
      {creating && <OneOffChargeDialog onClose={() => setCreating(false)} onDone={reload} />}
    </div>
  );
}

// RF-COB-01: lista de cobranças da gestão; a barreira de dados é o servidor (403 vira "sem permissão" na própria lista).
export function ChargesPage() {
  return (
    <ManagementLayout activeId="collections">
      <Content />
    </ManagementLayout>
  );
}
