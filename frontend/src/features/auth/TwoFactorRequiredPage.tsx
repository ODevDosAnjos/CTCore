import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";
import { useLogout } from "./useLogout";
import { useSession } from "./SessionProvider";
import { TwoFactorSetupDialog } from "./TwoFactorSetupDialog";

// R16: configuração obrigatória das duas etapas; só sai ativando ou saindo da conta.
export function TwoFactorRequiredPage() {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const { logout, pending, failed } = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <AuthShell title={t("twoFactor.required.title")} subtitle={t("twoFactor.required.text")}>
      {failed && <ErrorState onRetry={logout} />}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)}>{t("twoFactor.required.activate")}</Button>
        <Button variant="secondary" disabled={pending} onClick={logout}>
          {pending ? t("auth.logout.pending") : t("auth.logout.label")}
        </Button>
      </div>
      <TwoFactorSetupDialog open={open} onClose={() => setOpen(false)} onEnabled={() => void refresh()} />
    </AuthShell>
  );
}
