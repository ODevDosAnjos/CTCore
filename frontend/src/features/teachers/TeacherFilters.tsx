import { useTranslation } from "react-i18next";
import { ALL_STATUS, useTeacherFilterOptions } from "./useTeachers";
import { PillFilter } from "@/components/ui/pill-filter";

type Props = { get: (k: string) => string; set: (k: string, v: string) => void };


// Filtros de Pessoas › Professores (RF-PRO-01): modalidade, unidade e situação; o nome é a busca da própria tela.
export function TeacherFilters({ get, set }: Props) {
  const { t } = useTranslation();
  const { modalities, units } = useTeacherFilterOptions();
  const statuses = [
    { id: "ACTIVE", name: t("teachers.filters.statusActive") },
    { id: "INACTIVE", name: t("teachers.filters.statusInactive") },
  ];
  return (
    <>
      <PillFilter label={t("teachers.filters.modality")} value={get("modalityId")} onChange={(v) => set("modalityId", v)} allLabel={t("query.allF")} options={modalities.map((m) => ({ ...m, dot: true }))} />
      <PillFilter label={t("teachers.filters.unit")} value={get("unitId")} onChange={(v) => set("unitId", v)} allLabel={t("query.allF")} options={units} />
      <PillFilter label={t("teachers.filters.status")} value={get("status")} onChange={(v) => set("status", v || ALL_STATUS)} allLabel={t("query.allM")} options={statuses} />
    </>
  );
}
