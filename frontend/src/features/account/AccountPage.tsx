import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useSession } from "@/features/auth/SessionProvider";
import { AccessCard } from "./AccessCard";
import { AccountFrame, MANAGEMENT } from "./AccountFrame";
import { AccountMenuList } from "./AccountMenuList";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { NotificationsTab } from "./NotificationsTab";
import { SessionsSection } from "./SessionsSection";
import { TwoFactorSection } from "./TwoFactorSection";
import { useAccountSessions } from "./useAccount";
import { useManagementProfile } from "./useManagementProfile";

const TABS = ["acesso", "duas-etapas", "sessoes", "notificacoes"] as const;
const NARROW = "(max-width: 767px)"; // mesmo ponto de quebra da moldura da gestão (D7)

function useBelowMd() {
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(NARROW).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(NARROW);
    if (!m) return;
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}

// RF-ACE-04: "Minha conta" para qualquer perfil logado; as rotas agem só sobre a conta da sessão (R13).
export function AccountPage() {
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const role = session?.links.find((l) => l.id === session.activeLinkId)?.role ?? "";
  return <AccountFrame>{MANAGEMENT.includes(role) ? <ManagementAccount /> : <PortalAccount />}</AccountFrame>;
}

// Portal (Aluno e Responsável): a página de antes, até o item 498 (D1).
function PortalAccount() {
  const { t } = useTranslation();
  const sessions = useAccountSessions();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={t("account.title")} />
      <Card title={t("account.password.title")} heading="h2">
        <ChangePasswordForm onChanged={sessions.reload} />
      </Card>
      <Card title={t("account.email.title")} heading="h2">
        <ChangeEmailForm />
      </Card>
      <TwoFactorSection />
      <SessionsSection {...sessions} />
    </div>
  );
}

// Gestão (canvas MinhaConta): abas em `?aba=`; abaixo de 768 px sem `aba`, a lista de atalhos (canvas GMConta).
function ManagementAccount() {
  const { t } = useTranslation();
  const sessions = useAccountSessions();
  const profile = useManagementProfile();
  const narrow = useBelowMd();
  const [params, setParams] = useSearchParams();
  const raw = params.get("aba");
  const aba = (TABS as readonly string[]).includes(raw ?? "") ? raw! : undefined;
  return (
    <div className="space-y-4">
      {narrow && aba && (
        <Link to="/conta" className="inline-flex min-h-11 items-center gap-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft aria-hidden className="size-4" />
          {t("account.back")}
        </Link>
      )}
      <PageHeader title={t("account.title")} subtitle={profile.subtitle} />
      {narrow && !aba ? (
        <AccountMenuList sessionCount={sessions.status === "ready" ? sessions.items.length : null} />
      ) : (
        <Tabs
          label={t("account.tabs.label")}
          value={aba ?? "acesso"}
          onValueChange={(id) => setParams({ aba: id })}
          className="max-md:[&>[role=tablist]]:hidden"
          tabs={[
            { id: "acesso", label: t("account.tabs.access"), content: <AccessCard onPasswordChanged={sessions.reload} /> },
            { id: "duas-etapas", label: t("account.tabs.twoFactor"), content: <TwoFactorSection /> },
            { id: "sessoes", label: t("account.tabs.sessions"), content: <SessionsSection {...sessions} /> },
            { id: "notificacoes", label: t("account.tabs.notifications"), content: <NotificationsTab /> },
          ]}
        />
      )}
    </div>
  );
}
