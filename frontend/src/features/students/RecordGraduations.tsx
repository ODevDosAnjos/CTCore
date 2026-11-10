import { useTranslation } from "react-i18next";
import { ComingSoon } from "@/components/ui/coming-soon";

// D4 (item 467): graduações do aluno ainda não estão no contrato; a aba mostra o texto do canvas e o registro em "Em breve".
export function RecordGraduations() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="min-w-0 flex-1 text-sm text-muted-foreground">{t("students.record.graduations.text")}</p>
      <ComingSoon variant="button" label={t("students.record.graduations.register")} />
    </div>
  );
}
