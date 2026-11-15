import { useTranslation } from "react-i18next";
import { PillFilter } from "@/components/ui/pill-filter";
import { useBenefitModalities } from "./useBenefits";

// Filtros de Financeiro › Benefícios (RF-BEN-01): tipo e modalidade, em pílula; a situação são as abas e a unidade vem da barra.
export function BenefitFilters({ get, set }: { get: (k: string) => string; set: (k: string, v: string) => void }) {
  const { t } = useTranslation();
  const modalities = useBenefitModalities();
  const types = ["PERCENT", "AMOUNT"].map((s) => ({ id: s, name: t(`benefits.types.${s}`) }));
  return (
    <>
      <PillFilter label={t("benefits.filters.type")} value={get("type")} onChange={(v) => set("type", v)} allLabel={t("benefits.filters.allTypes")} options={types} />
      <PillFilter label={t("benefits.filters.modality")} value={get("modalityId")} onChange={(v) => set("modalityId", v)} allLabel={t("benefits.filters.allModalities")} options={modalities} />
    </>
  );
}
