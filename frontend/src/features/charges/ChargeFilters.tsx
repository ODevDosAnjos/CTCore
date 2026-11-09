import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { FilterSheet } from "@/components/query/FilterSheet";
import { Input, Select as Control } from "@/components/ui/field";
import { QuickFilters } from "@/components/ui/quick-filters";
import { useStudentFilterOptions } from "@/features/students/useStudents";
import { QUICK, SITUATIONS, TYPES, type ChargeQuick } from "./types";

type Props = { get: (k: string) => string; set: (k: string, v: string) => void; counts?: Record<string, number>; total?: number; clear: () => void };

const COUNT_KEY: Record<ChargeQuick, string> = { OVERDUE: "overdue", DUE_TODAY: "dueToday", IN_REVIEW: "inReview", PAID_MONTH: "paidMonth" };

function Select({ label, value, onChange, all, options }: { label: string; value: string; onChange: (v: string) => void; all: string; options: { id: string; name: string }[] }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm">
      {label}
      <Control value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Control>
    </label>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm">
      {label}
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// Filtros de Financeiro › Cobranças (RF-COB-01): abas exclusivas com contagem (Todas limpa o atalho), período de vencimento, situação, tipo, unidade, modalidade e turma; o aluno é a busca da tela.
export function ChargeFilters({ get, set, counts, total, clear }: Props) {
  const { t } = useTranslation();
  const { units, modalities, classes } = useStudentFilterOptions();
  const quick = get("quick");
  const options = [{ key: "ALL", label: t("charges.quick.ALL") }, ...QUICK.map((q) => ({ key: q, label: t(`charges.quick.${q}`), count: counts?.[COUNT_KEY[q]] }))];
  const active = ["from", "to", "status", "type", "unitId", "modalityId", "classId"].filter((k) => get(k)).length;
  return (
    <>
      <div className="order-first flex w-full flex-wrap items-center gap-2">
        <QuickFilters value={quick || "ALL"} onChange={(k) => set("quick", k === "ALL" ? "" : k)} options={options} />
        {quick === "IN_REVIEW" && (
          <Link to="/cobrancas/conferencia" className="inline-flex min-h-11 items-center text-sm underline">
            {t("charges.quick.openReview")}
          </Link>
        )}
      </div>
      <FilterSheet activeCount={active} resultsLabel={t("charges.showResults", { count: total ?? 0 })} onClear={clear}>
      <DateField label={t("charges.filters.from")} value={get("from")} onChange={(v) => set("from", v)} />
      <DateField label={t("charges.filters.to")} value={get("to")} onChange={(v) => set("to", v)} />
      <Select label={t("charges.filters.status")} value={get("status")} onChange={(v) => set("status", v)} all={t("charges.filters.allStatuses")} options={SITUATIONS.map((id) => ({ id, name: t(`charges.status.${id}`) }))} />
      <Select label={t("charges.filters.type")} value={get("type")} onChange={(v) => set("type", v)} all={t("charges.filters.allTypes")} options={TYPES.map((id) => ({ id, name: t(`charges.types.${id}`) }))} />
      <Select label={t("charges.filters.unit")} value={get("unitId")} onChange={(v) => set("unitId", v)} all={t("charges.filters.allUnits")} options={units} />
      <Select label={t("charges.filters.modality")} value={get("modalityId")} onChange={(v) => set("modalityId", v)} all={t("charges.filters.allModalities")} options={modalities} />
      <Select label={t("charges.filters.class")} value={get("classId")} onChange={(v) => set("classId", v)} all={t("charges.filters.allClasses")} options={classes} />
      </FilterSheet>
    </>
  );
}
