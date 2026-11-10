import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Entrada do assistente "Nova matrícula" (RF-MAT-01); com `studentId` abre já no aluno, a partir da etapa 2. Sem `studentId` (cabeçalho da lista) leva o ícone +.
export function NewEnrollmentLink({ studentId, className }: { studentId?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <Link to={studentId ? `/alunos/nova-matricula?aluno=${studentId}` : "/alunos/nova-matricula"} className={cn(buttonVariants({ variant: "default" }), "min-h-11", className)}>
      {!studentId && <Plus aria-hidden="true" />}
      {t("enrollmentWizard.open")}
    </Link>
  );
}
