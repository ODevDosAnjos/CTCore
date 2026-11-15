import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { QueryPage, type Query } from "@/components/query/QueryPage";
import type { Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PersonAvatar, PersonRow } from "@/components/ui/person-row";
import { QuickFilters } from "@/components/ui/quick-filters";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { usePermissions } from "@/features/permissions/usePermissions";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatDate } from "@/lib/format";
import { BenefitFilters } from "./BenefitFilters";
import { untilMonth, valueText } from "./benefitFormat";
import { EndBenefitDialog } from "./EndBenefitDialog";
import { GrantBenefitDialog } from "./GrantBenefitDialog";
import { BENEFIT_VIEWS, fetchBenefits, type BenefitRow } from "./useBenefits";

// "até 12/2026", "sem validade" ou, no vencido, "venceu 30/09".
function validity(t: TFunction, r: BenefitRow) {
  if (!r.validUntil) return t("benefits.noDeadline");
  if (r.status === "EXPIRED") return t("benefits.expiredOn", { date: formatDate(r.validUntil).slice(0, 5) });
  return t("benefits.until", { month: untilMonth(r.validUntil) });
}

const COUNT_KEY = { ACTIVE: "active", HIGH: "high", CLOSED: "closed" } as const;

// RF-BEN-01, RF-BEN-02, RF-BEN-03: abas por situação, tabela de benefícios, "Conceder benefício" e "Encerrar". A barreira de dados é o servidor.
function Content() {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const { permissions } = usePermissions();
  const canGrant = !!permissions && permissions.BENEFITS !== "NONE";
  const scope = useUnitScope();
  const all = !scope.selected || scope.selected === ALL;
  const unitId = all ? undefined : (scope.selected ?? undefined);
  const unitName = scope.units.find((u) => u.id === scope.selected)?.name ?? "";
  const [granting, setGranting] = useState(false);
  const [ending, setEnding] = useState<BenefitRow>();
  const [version, setVersion] = useState(0);
  const fetchPage = useCallback((q: Query) => fetchBenefits(q, unitId), [unitId]);
  const reload = () => setVersion((n) => n + 1);

  const grantButton = (full = false) =>
    canGrant && (
      <Button className={full ? "min-h-11 w-full" : "min-h-11"} onClick={() => setGranting(true)}>
        {t("benefits.grant.button")}
      </Button>
    );
  const endButton = (r: BenefitRow) =>
    canGrant && r.status === "ACTIVE" ? (
      <Button type="button" variant="ghost" className="min-h-11 px-2 font-medium" aria-label={t("benefits.end.buttonFor", { name: r.student.name })} onClick={() => setEnding(r)}>
        {t("benefits.end.button")}
      </Button>
    ) : null;
  const status = (r: BenefitRow) => <span className="rounded-md border px-2 py-0.5 text-sm">{t(`benefits.statuses.${r.status}`)}</span>;

  const columns: Column<BenefitRow>[] = [
    { key: "student", label: t("benefits.columns.student"), render: (r) => <PersonRow name={r.student.name} size="sm" secondary={all ? r.unit.name : undefined} /> },
    { key: "modality", label: t("benefits.columns.modality"), render: (r) => r.modality.name },
    { key: "type", label: t("benefits.columns.type"), render: (r) => t(`benefits.types.${r.type}`) },
    {
      key: "value",
      label: t("benefits.columns.value"),
      render: (r) => (
        <span className="flex flex-col">
          <span>{valueText(r)}</span>
          {r.high && <span className="text-xs text-muted-foreground">{t("benefits.highBadge")}</span>}
        </span>
      ),
    },
    { key: "reason", label: t("benefits.columns.reason"), render: (r) => <span className="break-words">{r.reason}</span> },
    { key: "decidedBy", label: t("benefits.columns.decidedBy"), render: (r) => r.decidedBy },
    { key: "validUntil", label: t("benefits.columns.validUntil"), render: (r) => validity(t, r) },
    { key: "status", label: t("benefits.columns.status"), render: status },
    ...(canGrant ? [{ key: "actions", label: t("benefits.columns.actions"), hideLabel: true, render: endButton }] : []),
  ];

  const card = (r: BenefitRow) => (
    <RowCard
      lead={<PersonAvatar name={r.student.name} size="sm" />}
      title={r.student.name}
      meta={
        <>
          <span>{[r.modality.name, all ? r.unit.name : ""].filter(Boolean).join(" · ")}</span>
          <span>
            {t(`benefits.types.${r.type}`)} {valueText(r)}
            {r.high ? ` · ${t("benefits.highBadge")}` : ""}
          </span>
          <span>{validity(t, r)}</span>
        </>
      }
      badge={status(r)}
      action={endButton(r)}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        key={version}
        header={({ counts, get, set }) => (
          <>
            <PageHeader title={t("benefits.title")} subtitle={all ? t("benefits.subtitleAll") : t("benefits.subtitle", { unit: unitName })} actions={!narrow && grantButton()} />
            <nav aria-label={t("benefits.tabsLabel")}>
              <QuickFilters
                value={get("view")}
                onChange={(k) => set("view", k)}
                options={BENEFIT_VIEWS.map((v) => ({ key: v, label: t(`benefits.views.${v}`), count: counts?.[COUNT_KEY[v]] }))}
              />
            </nav>
          </>
        )}
        defaultFilters={{ view: "ACTIVE" }}
        tabKeys={["view"]}
        tableCard
        searchPlaceholder={t("benefits.search")}
        canvasPagination
        canvasStates
        columns={columns}
        cardsBelow="sm"
        cards={card}
        fetchPage={fetchPage}
        rowKey={(r) => r.id}
        filterKeys={["view", "type", "modalityId"]}
        filters={(p) => <BenefitFilters {...p} />}
        texts={(get) => ({ emptyTitle: t(`benefits.empty.${get("view")}.title`), emptyText: t(`benefits.empty.${get("view")}.text`) })}
        emptyAction={grantButton()}
        footer={() => <p className="text-xs text-muted-foreground">{t("benefits.footnote")}</p>}
      />
      {narrow && grantButton(true)}
      {granting && <GrantBenefitDialog onClose={() => setGranting(false)} onDone={reload} />}
      {ending && <EndBenefitDialog benefit={ending} onClose={() => setEnding(undefined)} onDone={reload} />}
    </div>
  );
}

export function BenefitsPage() {
  return (
    <ManagementLayout activeId="benefits">
      <Content />
    </ManagementLayout>
  );
}
