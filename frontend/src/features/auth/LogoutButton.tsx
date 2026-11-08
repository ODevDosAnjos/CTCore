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

export function LogoutButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { logout, pending, failed } = useLogout();
  return (
    <>
      <Button type="button" variant="ghost" size="sm" className={cn("min-h-11", className)} disabled={pending} onClick={logout}>
        <LogOut aria-hidden="true" />
        {pending ? t("auth.logout.pending") : t("auth.logout.label")}
      </Button>
      {failed && <LogoutError onRetry={logout} />}
    </>
  );
}
