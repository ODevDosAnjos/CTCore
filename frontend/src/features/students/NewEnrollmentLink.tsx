import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Entrada do assistente "Nova matrícula" (RF-MAT-01); com `studentId` abre já no aluno, a partir da etapa 2. Sem `studentId` (cabeçalho da lista) leva o ícone +.
// `label` troca o texto (a ficha usa "Adicionar modalidade"); `disabled` mostra o botão sem navegar (limite de 10 modalidades ativas).
export function NewEnrollmentLink({ studentId, className, label, disabled }: { studentId?: string; className?: string; label?: string; disabled?: boolean }) {
  const { t } = useTranslation();
  const text = label ?? t("enrollmentWizard.open");
  if (disabled)
    return (
      <Button type="button" disabled icon={<Plus aria-hidden="true" />} className={cn("min-h-11", className)}>
        {text}
      </Button>
    );
  return (
    <Link to={studentId ? `/alunos/nova-matricula?aluno=${studentId}` : "/alunos/nova-matricula"} className={cn(buttonVariants({ variant: "default" }), "min-h-11", className)}>
      {(!studentId || label) && <Plus aria-hidden="true" />}
      {text}
    </Link>
  );
}
