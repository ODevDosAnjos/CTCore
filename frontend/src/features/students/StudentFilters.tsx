import { useTranslation } from "react-i18next";
import { FilterSheet } from "@/components/query/FilterSheet";
import { QuickFilters } from "@/components/ui/quick-filters";
import { PillFilter } from "@/components/ui/pill-filter";
import { useGraduation } from "@/features/modalities/useGraduation";
import { useStudentFilterOptions } from "./useStudents";

const SEALS = ["INCOMPLETE_REGISTRATION", "EMAIL_PROBLEM", "BIRTHDAY_TODAY", "NEW", "SCHOLARSHIP", "TERM_PENDING"];

type Props = { get: (k: string) => string; set: (k: string, v: string) => void; counts?: Record<string, number>; total?: number; clear: () => void };


// Filtros de Pessoas › Alunos (RF-ALU-01): unidade de cadastro, faixa etária, selo (RF-ALU-02), modalidade, turma e nível; o nome é a busca da própria tela.
// As abas mostram a contagem do servidor; abaixo de 640 px os filtros em pílula abrem numa folha.
export function StudentFilters({ get, set, counts, total, clear }: Props) {
  const { t } = useTranslation();
  const { units, ageRanges, modalities, classes } = useStudentFilterOptions();
  const modalityId = get("modalityId");
  const graduation = useGraduation(modalityId || null);
  const allF = t("query.allF");
  const allM = t("query.allM");
  const seals = SEALS.map((id) => ({ id, name: t(`students.seals.${id}`) }));
  const levels = graduation.data?.levels ?? [];
  const tab = get("status") === "FORMER" ? "FORMER" : get("status") === "ACTIVE" ? "ACTIVE" : get("financial") === "OVERDUE" ? "OVERDUE" : "";
  const withCount = (key: string, n?: number) => ({ key, label: t(`students.quick.${key}`), count: n });
  // As abas são exclusivas e o segundo clique na ativa a desliga (D2).
  const pick = (key: string) => {
    const next = key === tab ? "" : key;
    set("status", next === "ACTIVE" || next === "FORMER" ? next : "");
    set("financial", next === "OVERDUE" ? "OVERDUE" : "");
  };
  const active = ["unitId", "ageRangeId", "seal", "modalityId", "classId", "levelId"].filter((k) => get(k)).length;
  return (
    <>
      <QuickFilters
        className="order-first w-full"
        value={tab}
        onChange={pick}
        options={[withCount("ACTIVE", counts?.active), withCount("OVERDUE", counts?.overdue), { ...withCount("BLOCKED"), soon: true }, withCount("FORMER", counts?.former)]}
      />
      <FilterSheet activeCount={active} resultsLabel={t("students.showResults", { count: total ?? 0 })} onClear={clear}>
      <PillFilter label={t("students.filters.unit")} value={get("unitId")} onChange={(v) => set("unitId", v)} allLabel={allF} options={units} />
      <PillFilter label={t("students.filters.ageRange")} value={get("ageRangeId")} onChange={(v) => set("ageRangeId", v)} allLabel={allF} options={ageRanges} />
      <PillFilter label={t("students.filters.seal")} value={get("seal")} onChange={(v) => set("seal", v)} allLabel={allM} options={seals} />
      <PillFilter
        label={t("students.filters.modality")}
        value={modalityId}
        onChange={(v) => {
          set("levelId", "");
          set("modalityId", v);
        }}
        allLabel={allF}
        options={modalities}
      />
      <PillFilter label={t("students.filters.class")} value={get("classId")} onChange={(v) => set("classId", v)} allLabel={allF} options={classes} />
      <PillFilter label={t("students.filters.level")} value={get("levelId")} onChange={(v) => set("levelId", v)} allLabel={allM} options={levels} disabled={!modalityId} />
      </FilterSheet>
    </>
  );
}
