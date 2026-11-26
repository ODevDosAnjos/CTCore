import { useEffect, useState } from "react";
import { ArrowLeft, Download, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { CARD_TITLE, Card } from "@/components/Card";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PageHeader } from "@/components/ui/page-header";
import { PortalHeading } from "@/features/portal/PortalHeading";
import { MenuList, SoonRow } from "@/features/portal/PortalMenuRows";
import { Tabs } from "@/components/ui/tabs";
import { useTabParam } from "@/components/ui/useTabParam";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { useSession } from "@/features/auth/SessionProvider";
import { isManagement } from "@/routes";
import { AccessCard } from "./AccessCard";
import { AccountMenuList } from "./AccountMenuList";
import { NotificationsTab } from "./NotificationsTab";
import { SessionsSection } from "./SessionsSection";
import { TwoFactorSection } from "./TwoFactorSection";
import { useAccountSessions } from "./useAccount";

const TABS = ["acesso", "duas-etapas", "sessoes", "notificacoes"] as const;
const DATA_CARDS = ["download", "delete"] as const;
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
  if (isManagement(role)) return <ManagementAccount />;
  // No celular a barra do portal não tem o botão de sair: ele fica no fim de Minha conta.
  return (
    <>
      <PortalAccount />
      <div className="mt-6 md:hidden">
        <LogoutButton />
      </div>
    </>
  );
}

// Portal (Aluno e Responsável, canvas PortalConta): rótulo, "‹ Voltar" no celular, Acesso, duas etapas, sessões e os cartões de dados ("Em breve", Sprint 13).
function PortalAccount() {
  const { t } = useTranslation();
  const sessions = useAccountSessions();
  const narrow = useBelowSm();
  return (
    <div className="flex flex-col gap-4">
      <Link to="/portal/minhas-informacoes" className="inline-flex min-h-11 items-center gap-1 self-start text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden">
        <ArrowLeft aria-hidden className="size-4" />
        {t("account.portal.back")}
      </Link>
      <PortalHeading label={t("account.portal.label")} title={t("account.title")} />
      <div className="grid items-start gap-4 md:grid-cols-2">
        <AccessCard onPasswordChanged={sessions.reload} portal />
        <TwoFactorSection portal />
      </div>
      <SessionsSection {...sessions} portal />
      {narrow ? (
        <MenuList label={t("account.portal.dataMenu")}>
          <SoonRow icon={Download} label={t("account.portal.download.title")} />
          <SoonRow icon={Trash2} label={t("account.portal.delete.title")} />
        </MenuList>
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {DATA_CARDS.map((k) => (
            <Card key={k} heading="h2" titleClassName={CARD_TITLE} title={t(`account.portal.${k}.title`)}>
              <p className="mb-3 text-sm text-muted-foreground">{t(`account.portal.${k}.text`)}</p>
              <ComingSoon tipAlign="end" variant="button" label={t(`account.portal.${k}.title`)} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Gestão (canvas MinhaConta): abas em `?aba=`; abaixo de 768 px sem `aba`, a lista de atalhos (canvas GMConta).
function ManagementAccount() {
  const { t } = useTranslation();
  const sessions = useAccountSessions();
  const narrow = useBelowMd();
  const [params] = useSearchParams();
  const [tab, setTab] = useTabParam(TABS);
  const raw = params.get("aba");
  // Abaixo de 768 px sem `aba` válida a tela é a lista de atalhos.
  const aba = (TABS as readonly string[]).includes(raw ?? "") ? tab : undefined;
  return (
    <div className="space-y-4">
      {narrow && aba && (
        <Link to="/conta" className="inline-flex min-h-11 items-center gap-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft aria-hidden className="size-4" />
          {t("account.back")}
        </Link>
      )}
      <PageHeader title={t("account.title")} />
      {narrow && !aba ? (
        <AccountMenuList sessionCount={sessions.status === "ready" ? sessions.items.length : null} />
      ) : (
        <Tabs
          label={t("account.tabs.label")}
          value={tab}
          onValueChange={setTab}
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
