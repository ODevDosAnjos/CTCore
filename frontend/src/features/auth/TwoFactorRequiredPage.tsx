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
  const { state, refresh } = useSession();
  // RN-ACE-24: sem vínculo de Coordenador, quem obriga é a organização.
  const coordinator = state.status === "ready" && state.session.links.some((l) => l.role === "COORDINATOR");
  const { logout, pending, failed } = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <AuthShell title={t("twoFactor.required.title")} subtitle={t(coordinator ? "twoFactor.required.text" : "twoFactor.required.organizationText")}>
      {failed && <ErrorState onRetry={logout} />}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen(true)}>{t("twoFactor.required.activate")}</Button>
        <Button variant="secondary" disabled={pending} onClick={logout}>
          {pending ? t("auth.logout.pending") : t("auth.logout.label")}
        </Button>
      </div>
      {open && <TwoFactorSetupDialog open required onClose={() => setOpen(false)} onEnabled={() => void refresh()} />}
    </AuthShell>
  );
}
