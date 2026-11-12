import { useTranslation } from "react-i18next";
import { useBelowSm } from "@/components/query/useBelowSm";
import { FilterSheet } from "@/components/query/FilterSheet";
import { PillFilter } from "@/components/ui/pill-filter";
import { QuickFilters } from "@/components/ui/quick-filters";
import { Select } from "@/components/ui/field";
import { useClassFilterOptions } from "./useClasses";

type Props = { get: (k: string) => string; set: (k: string, v: string) => void };

export function Filter({ label, value, onChange, all, options }: { label: string; value: string; onChange: (v: string) => void; all: string; options: { id: string; name: string }[] }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-sm">
      {label}
      <Select className="min-h-11" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{all}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </label>
  );
}

// Filtros de Operação › Turmas (RF-TUR-01): modalidade, professor, faixa etária, dia e situação (a unidade vem da barra); o nome é a busca da própria tela.
// Abaixo de 640 px: abas de situação com contagem, pílulas de modalidade e a folha de filtros para o resto (D3).
export function ClassFilters({ get, set, counts, total, clear }: Props & { counts?: Record<string, number>; total?: number; clear: () => void }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const { modalities, teachers, ageRanges } = useClassFilterOptions();
  const allF = t("query.allF");
  const allM = t("query.allM");
  const weekdays = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ id: String(d), name: t(`classes.weekdaysLong.${d}`) }));
  const more = (
    <>
      <PillFilter label={t("classes.filters.teacher")} value={get("teacherId")} onChange={(v) => set("teacherId", v)} allLabel={allM} options={teachers} />
      <PillFilter label={t("classes.filters.ageRange")} value={get("ageRangeId")} onChange={(v) => set("ageRangeId", v)} allLabel={allF} options={ageRanges} />
      <PillFilter label={t("classes.filters.weekday")} value={get("weekday")} onChange={(v) => set("weekday", v)} allLabel={allM} options={weekdays} />
    </>
  );
  if (narrow) {
    const status = get("status");
    const modalityId = get("modalityId");
    const active = ["teacherId", "ageRangeId", "weekday"].filter((k) => get(k)).length;
    return (
      <>
        <QuickFilters
          className="order-first w-full"
          value={status}
          onChange={(k) => set("status", k === status ? "" : k)}
          options={[
            { key: "ACTIVE", label: t("classes.filters.statusActive"), count: counts?.active },
            { key: "INACTIVE", label: t("classes.filters.statusInactive"), count: counts?.inactive },
          ]}
        />
        <QuickFilters className="w-full" value={modalityId} onChange={(k) => set("modalityId", k === modalityId ? "" : k)} options={modalities.map((m) => ({ key: m.id, label: m.name }))} />
        <FilterSheet activeCount={active} resultsLabel={t("classes.showResults", { count: total ?? 0 })} onClear={clear}>
          {more}
        </FilterSheet>
      </>
    );
  }
  const statuses = ["ACTIVE", "INACTIVE"].map((s) => ({ id: s, name: t(`classes.filters.status${s === "ACTIVE" ? "Active" : "Inactive"}`) }));
  return (
    <>
      <PillFilter label={t("classes.filters.modality")} value={get("modalityId")} onChange={(v) => set("modalityId", v)} allLabel={allF} options={modalities.map((m) => ({ ...m, dot: true }))} />
      {more}
      <PillFilter label={t("classes.filters.status")} value={get("status")} onChange={(v) => set("status", v)} allLabel={t("classes.filters.allStatuses")} options={statuses} />
    </>
  );
}
