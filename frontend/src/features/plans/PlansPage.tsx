import { useCallback, useState, type ReactNode } from "react";
import { FileText, Gift, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { listSearch } from "@/components/query/useListTo";
import { formatMoney } from "@/components/fields/masks";
import { QueryPage, type Query } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ErrorState, ForbiddenState } from "@/components/states";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModalityDot } from "@/components/ui/modality-dot";
import { PageHeader } from "@/components/ui/page-header";
import { usePermissions } from "@/features/permissions/usePermissions";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { DeactivatePlanDialog } from "./DeactivatePlanDialog";
import { PlanFilters } from "./PlanFilters";
import { PlanFormDialog } from "./PlanFormDialog";
import type { PlansOutlet } from "./PlanInspectDrawer";
import { fetchPlans, usePlanOptions, usePlanSummary, type PlanRow } from "./usePlans";

function SummaryCard({ icon, label, value, note, action }: { icon: ReactNode; label: string; value: number; note: string; action: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-card border bg-card p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
        <h2 className="font-heading text-2xl font-semibold uppercase leading-[1.1] tracking-[0.02em]">{label}</h2>
      </div>
      <div className="flex items-center gap-3">
        <span data-stat-value className="font-heading text-[40px] font-semibold leading-none">
          {value}
        </span>
        <span className="text-[13px] text-muted-foreground">{note}</span>
      </div>
      <div className="flex items-center gap-3">{action}</div>
    </div>
  );
}

// RF-PLA-01, RF-PLA-02, RF-PLA-03, RN-PLA-06: resumo, tabela de planos (ativos e desativados), editar, desativar e reativar.
// A barreira de dados é o servidor (403 vira "sem permissão" no resumo e na tabela).
function Content() {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const navigate = useNavigate();
  const { search } = useLocation();
  const scope = useUnitScope();
  const { permissions } = usePermissions();
  const canManage = !!permissions && permissions.PLANS !== "NONE";
  const all = !scope.selected || scope.selected === ALL;
  const unitId = all ? null : scope.selected;
  const unitName = scope.units.find((u) => u.id === scope.selected)?.name ?? "";
  const { summary, status, retry } = usePlanSummary(unitId);
  const options = usePlanOptions(true);
  const crossUnit = options.options?.crossUnitTraining === "plan";
  const [editing, setEditing] = useState<PlanRow | "new" | null>(null);
  const [deactivating, setDeactivating] = useState<PlanRow | null>(null);
  const [version, setVersion] = useState(0);
  const reload = () => {
    setVersion((n) => n + 1);
    retry();
  };
  const fetchPage = useCallback((q: Query) => fetchPlans(q, unitId ?? undefined), [unitId]);
  const open = (p: PlanRow) => (p.status === "INACTIVE" ? void navigate({ pathname: `/planos/${p.id}`, search: listSearch(search) }) : setEditing(p));
  const frequency = (p: PlanRow) => (p.weeklyFrequency === null ? t("plans.table.free") : t("plans.table.perWeek", { count: p.weeklyFrequency }));
  const newButton = (kind: "card" | "header" | "full" = "header") =>
    canManage && (
      <Button
        variant={kind === "card" ? "outline" : "primary"}
        size={kind === "full" ? "md" : "sm"}
        className={kind === "full" ? "min-h-11 w-full" : undefined}
        onClick={() => setEditing("new")}
      >
        {kind !== "card" && <Plus aria-hidden="true" />}
        {t("plans.newButton")}
      </Button>
    );

  const fullButton = newButton("full");

  const columns: Column<PlanRow>[] = [
    { key: "modality", label: t("plans.table.columns.modality"), render: (r) => <ModalityDot name={r.modality.name} /> },
    {
      key: "name",
      label: t("plans.table.columns.name"),
      render: (r) => (
        <span className="flex min-w-0 flex-col break-words">
          <span className="font-medium">{r.name}</span>
          {all && <span className="text-xs text-muted-foreground">{r.unit.name}</span>}
        </span>
      ),
    },
    { key: "value", label: t("plans.table.columns.value"), numeric: true, render: (r) => formatMoney(r.valueCents) },
    { key: "frequency", label: t("plans.table.columns.frequency"), render: frequency },
    { key: "students", label: t("plans.table.columns.students"), numeric: true, render: (r) => r.studentsUsing },
    ...(crossUnit
      ? [
          {
            key: "otherUnits",
            label: t("plans.table.columns.otherUnits"),
            render: (r: PlanRow) => <Badge tone={r.validOtherUnits ? "info" : "neutral"}>{t(r.validOtherUnits ? "plans.table.otherYes" : "plans.table.otherNo")}</Badge>,
          },
        ]
      : []),
    { key: "status", label: t("plans.table.columns.status"), render: (r) => <StatusBadge status={r.status} label={t(`plans.table.statuses.${r.status}`)} /> },
    ...(canManage
      ? [
          {
            key: "actions",
            label: t("plans.table.columns.actions"),
            hideLabel: true,
            render: (r: PlanRow) => (
              <Button type="button" variant="ghost" className="min-h-11 px-2 font-medium" aria-label={t("plans.table.editFor", { name: r.name })} onClick={() => open(r)}>
                {t("plans.table.edit")}
              </Button>
            ),
          },
        ]
      : []),
  ];

  const card = (r: PlanRow) => {
    const students = t("plans.table.students", { count: r.studentsUsing });
    const body = (
      <RowCard
        lead={<ModalityDot className="min-h-11 text-sm" name={r.modality.name} />}
        title={r.name}
        meta={<span>{t("plans.table.cardMeta", { frequency: frequency(r), students })}</span>}
        badge={r.status === "INACTIVE" ? <StatusBadge status={r.status} label={t("plans.table.statuses.INACTIVE")} /> : undefined}
        action={<span className="font-medium tabular-nums">{formatMoney(r.valueCents)}</span>}
      />
    );
    if (!canManage) return body;
    return (
      <button type="button" className="block w-full text-left" aria-label={t("plans.table.editFor", { name: r.name })} onClick={() => open(r)}>
        {body}
      </button>
    );
  };

  if (status === "forbidden") return <ForbiddenState />;
  const subtitle = narrow ? unitName || t("plans.mobileSubtitleAll") : all ? t("plans.subtitleAll") : t("plans.subtitle", { unit: unitName });
  let summaryView: ReactNode;
  if (status === "error") summaryView = <ErrorState variant="card" onRetry={retry} />;
  else if (status === "loading" || !summary) summaryView = <div role="status" aria-label={t("states.loadingCard")} className="h-24 animate-pulse rounded-card bg-neutral" />;
  else {
    const { plans, benefits } = summary;
    if (narrow)
      summaryView = (
        <nav aria-label={t("plans.tabsLabel")} className="flex gap-2">
          <span aria-current="page" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">
            {t("plans.tabPlans")} <span className="text-xs opacity-80">{plans.active}</span>
          </span>
          <Link to="/beneficios" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-medium">
            {t("plans.tabBenefits")} <span className="text-xs text-muted-foreground">{benefits.active}</span>
          </Link>
        </nav>
      );
    else
      summaryView = (
        <section aria-label={t("plans.summaryLabel")} className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            icon={<FileText className="size-[22px]" />}
            label={t("plans.cards.plansTitle")}
            value={plans.active}
            note={all ? t("plans.cards.plansNoteAll") : t("plans.cards.plansNote", { unit: unitName })}
            action={newButton("card")}
          />
          <SummaryCard
            icon={<Gift className="size-[22px]" />}
            label={t("plans.cards.benefitsTitle")}
            value={benefits.active}
            note={t("plans.cards.benefitsNote", { high: benefits.high })}
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/beneficios">{t("plans.cards.seeBenefits")}</Link>
              </Button>
            }
          />
        </section>
      );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("plans.title")} subtitle={subtitle} />
      {summaryView}
      <QueryPage
        key={version}
        header={({ get, set }) =>
          narrow ? (
            <div className="flex">
              <PlanFilters get={get} set={set} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-[22px] font-semibold uppercase leading-[1.1] tracking-[0.02em]">{t("plans.table.title")}</h2>
              <span className="grow" />
              <PlanFilters get={get} set={set} />
              {newButton()}
            </div>
          )
        }
        tableCard
        search={false}
        canvasPagination
        canvasStates
        columns={columns}
        cardsBelow="sm"
        cards={card}
        fetchPage={fetchPage}
        rowKey={(r) => r.id}
        onRowClick={(r) => {
          if (r.status === "INACTIVE" && canManage) open(r);
        }}
        rowClassName={(r) => (r.status === "INACTIVE" ? "text-muted-foreground" : undefined)}
        filterKeys={["modalityId"]}
        texts={{ emptyTitle: t("plans.table.emptyTitle"), emptyText: t("plans.table.emptyText") }}
        emptyAction={newButton("card")}
        footer={() => <p className="text-xs text-muted-foreground">{t("plans.table.footnote")}</p>}
      />
      {narrow && fullButton}
      <PlanFormDialog
        open={editing !== null}
        plan={editing && editing !== "new" ? editing : undefined}
        onClose={() => setEditing(null)}
        onSaved={reload}
        onDeactivate={(p) => {
          setEditing(null);
          setDeactivating(p);
        }}
      />
      <DeactivatePlanDialog plan={deactivating} onClose={() => setDeactivating(null)} onDone={reload} />
      <Outlet context={{ reload, showOtherUnits: crossUnit } satisfies PlansOutlet} />
    </div>
  );
}

export function PlansPage() {
  return <Content />;
}
