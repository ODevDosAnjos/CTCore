import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLogout } from "./useLogout";

/** Erro da saída (R5): aviso fixo com "Tentar de novo". */
export function LogoutError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-x-4 top-16 z-50 mx-auto max-w-md rounded-md border bg-background shadow-lg">
      <ErrorState onRetry={onRetry} />
    </div>
  );
}

/** `iconOnly`: só o ícone (o nome "Sair da conta" fica para leitor de tela). */
export function LogoutButton({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const { t } = useTranslation();
  const { logout, pending, failed } = useLogout();
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className={cn("min-h-11", className)} disabled={pending} onClick={logout}>
        <LogOut aria-hidden="true" />
        <span className={iconOnly ? "sr-only" : undefined}>{pending ? t("auth.logout.pending") : t("auth.logout.label")}</span>
      </Button>
      {failed && <LogoutError onRetry={logout} />}
    </>
  );
}
