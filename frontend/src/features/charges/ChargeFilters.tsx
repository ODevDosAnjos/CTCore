import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { FilterSheet } from "@/components/query/FilterSheet";
import { useBelowSm } from "@/components/query/useBelowSm";
import { PillFilter } from "@/components/ui/pill-filter";
import { QuickFilters } from "@/components/ui/quick-filters";
import { SearchBox } from "@/components/ui/search-box";
import { useStudentFilterOptions } from "@/features/students/useStudents";
import { periodOptions } from "./period";
import { QUICK, SITUATIONS, TYPES, type ChargeQuick } from "./types";

type Props = { get: (k: string) => string; set: (k: string, v: string) => void; counts?: Record<string, number>; total?: number; clear: () => void };

const COUNT_KEY: Record<ChargeQuick, string> = { OVERDUE: "overdue", DUE_TODAY: "dueToday", IN_REVIEW: "inReview", PAID_MONTH: "paidMonth" };

// Filtros de Financeiro › Cobranças (RF-COB-01): abas exclusivas com contagem (Todas limpa o atalho; sem número até a primeira resposta) e filtros em pílula
// (período, situação, tipo, modalidade e turma; a unidade vem da barra). Abaixo de 640 px as abas são a linha de pílulas e busca e filtros vão para a folha.
export function ChargeFilters({ get, set, counts, total, clear }: Props) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const { modalities, classes } = useStudentFilterOptions();
  const periods = useMemo(() => periodOptions(new Date()), []);
  const quick = get("quick");
  const options = [
    { key: "ALL", label: t("charges.quick.ALL"), count: counts?.all },
    ...QUICK.map((q) => ({ key: q, label: t(`charges.quick.${q}`), count: counts?.[COUNT_KEY[q]] })),
  ];
  const allF = t("query.allF");
  const allM = t("query.allM");
  const pills = (
    <>
      <PillFilter label={t("charges.filters.period")} value={get("period")} onChange={(v) => set("period", v)} allLabel={t("charges.filters.allPeriods")} options={periods} />
      <PillFilter label={t("charges.filters.status")} value={get("status")} onChange={(v) => set("status", v)} allLabel={allF} options={SITUATIONS.map((id) => ({ id, name: t(`charges.status.${id}`) }))} />
      <PillFilter label={t("charges.filters.type")} value={get("type")} onChange={(v) => set("type", v)} allLabel={allM} options={TYPES.map((id) => ({ id, name: t(`charges.types.${id}`) }))} />
      <PillFilter label={t("charges.filters.modality")} value={get("modalityId")} onChange={(v) => set("modalityId", v)} allLabel={allF} options={modalities} />
      <PillFilter label={t("charges.filters.class")} value={get("classId")} onChange={(v) => set("classId", v)} allLabel={allF} options={classes} />
    </>
  );
  const active = ["q", "period", "status", "type", "modalityId", "classId"].filter((k) => get(k)).length;
  const sheet = (
    <FilterSheet activeCount={active} resultsLabel={t("charges.showResults", { count: total ?? 0 })} onClear={clear}>
      {narrow && <SearchBox aria-label={t("query.search")} placeholder={t("charges.search")} value={get("q")} onChange={(v) => set("q", v)} />}
      {pills}
    </FilterSheet>
  );
  const tabs = <QuickFilters className={narrow ? "flex-nowrap" : undefined} value={quick || "ALL"} onChange={(k) => set("quick", k === "ALL" ? "" : k)} options={options} />;
  // Celular: uma linha de pílulas que rola na horizontal, com o botão Filtros no fim; a tela de atrasados fica para a tela larga.
  if (narrow)
    return (
      <div className="order-first -mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 pb-1 [&_button]:shrink-0">
        {tabs}
        {sheet}
      </div>
    );
  return (
    <>
      <div className="order-first flex w-full flex-wrap items-center gap-x-4 gap-y-2">
        {tabs}
        <Link to="/cobrancas/atrasados" className="inline-flex min-h-11 items-center text-sm underline">
          {t("charges.seeOverdue")}
        </Link>
        {quick === "IN_REVIEW" && (
          <Link to="/cobrancas/conferencia" className="inline-flex min-h-11 items-center text-sm underline">
            {t("charges.quick.openReview")}
          </Link>
        )}
      </div>
      {sheet}
    </>
  );
}
