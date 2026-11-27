import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { useTabParam } from "@/components/ui/useTabParam";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { useSession } from "@/features/auth/SessionProvider";
import { PortalHeading } from "@/features/portal/PortalHeading";
import { cn } from "@/lib/utils";
import { isManagement } from "@/routes";
import { AccessCard } from "./AccessCard";
import { AccountMenuList } from "./AccountMenuList";
import { MyLinks } from "./MyLinks";
import { NotificationsTab, PortalNotifications } from "./NotificationsTab";
import { PrivacyTab } from "./PrivacyTab";
import { ProfileTab } from "./ProfileTab";
import { SessionsSection } from "./SessionsSection";
import { TwoFactorSection } from "./TwoFactorSection";
import { useAccountSessions } from "./useAccount";

const TABS = ["perfil", "seguranca", "notificacoes", "privacidade"] as const;
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

// RF-ACE-04, decisão 24: "Minha conta" para qualquer perfil logado, nas mesmas quatro abas (`?aba=`); as rotas agem só sobre a conta da sessão (R13).
export function AccountPage() {
  const { t } = useTranslation();
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const portal = !isManagement(session?.links.find((l) => l.id === session.activeLinkId)?.role ?? "");
  const sessions = useAccountSessions();
  const narrow = useBelowMd();
  const [params] = useSearchParams();
  const [tab, setTab] = useTabParam(TABS);
  const chosen = (TABS as readonly string[]).includes(params.get("aba") ?? "");

  const access = <AccessCard onPasswordChanged={sessions.reload} portal={portal} />;
  const twoFactor = <TwoFactorSection portal={portal} />;
  const sessionList = <SessionsSection {...sessions} portal={portal} />;
  const content = {
    perfil: portal ? (
      <MyLinks portal />
    ) : (
      <div className="space-y-4">
        <ProfileTab />
        <MyLinks portal={false} />
      </div>
    ),
    // D5: no portal, o arranjo do canvas PortalConta; na gestão, o do MinhaConta (duas colunas só em tela larga).
    seguranca: portal ? (
      <div className="flex flex-col gap-4">
        <div className="grid items-start gap-4 md:grid-cols-2">
          {access}
          {twoFactor}
        </div>
        {sessionList}
      </div>
    ) : (
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          {access}
          {twoFactor}
        </div>
        <div className="min-w-0">{sessionList}</div>
      </div>
    ),
    notificacoes: portal ? <PortalNotifications /> : <NotificationsTab />,
    privacidade: <PrivacyTab portal={portal} />,
  };
  const tabs = (
    <Tabs
      label={t("account.tabs.label")}
      value={tab}
      onValueChange={setTab}
      className={cn(!portal && "max-md:[&>[role=tablist]]:hidden")}
      tabs={TABS.map((id) => ({ id, label: t(`account.tabs.${id}`), content: content[id] }))}
    />
  );

  if (portal)
    return (
      <div className="flex flex-col gap-4">
        <Link to="/portal/minhas-informacoes" className="inline-flex min-h-11 items-center gap-1 self-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">
          <ArrowLeft aria-hidden className="size-4" />
          {t("account.portal.back")}
        </Link>
        <PortalHeading label={t("account.portal.label")} title={t("account.title")} />
        {tabs}
        {/* No celular a barra do portal não tem o botão de sair: ele fica no fim de Minha conta. */}
        <div className="mt-2 md:hidden">
          <LogoutButton />
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      {narrow && chosen && (
        <Link to="/conta" className="inline-flex min-h-11 items-center gap-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft aria-hidden className="size-4" />
          {t("account.back")}
        </Link>
      )}
      <PageHeader title={t("account.title")} />
      {/* Abaixo de 768 px sem `aba` válida a tela é a lista de atalhos (canvas GMConta). */}
      {narrow && !chosen ? <AccountMenuList sessionCount={sessions.status === "ready" ? sessions.items.length : null} /> : tabs}
    </div>
  );
}
