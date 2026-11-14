import { useTranslation } from "react-i18next";
import { PillFilter } from "@/components/ui/pill-filter";
import { usePlanModalities } from "./usePlans";

// Filtro de Financeiro › Planos e benefícios (RF-PLA-02): só a modalidade, em pílula; a unidade vem da barra.
export function PlanFilters({ get, set }: { get: (k: string) => string; set: (k: string, v: string) => void }) {
  const { t } = useTranslation();
  const modalities = usePlanModalities().map((m) => ({ ...m, dot: true }));
  return <PillFilter label={t("plans.table.filters.modality")} value={get("modalityId")} onChange={(v) => set("modalityId", v)} allLabel={t("plans.table.filters.allModalities")} options={modalities} />;
}
