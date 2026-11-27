import type { ReactNode } from "react";
import { Bell, ChevronRight, KeyRound, Lock, LogOut, Mail, ShieldCheck, Smartphone, UserRound, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogoutError } from "@/features/auth/LogoutButton";
import { useLogout } from "@/features/auth/useLogout";
import { useSession } from "@/features/auth/SessionProvider";
import { relativeDay } from "@/lib/format";
import { useManagementProfile } from "./useManagementProfile";

function Row({ to, label, value, icon: Icon }: { to: string; label: string; value?: ReactNode; icon: LucideIcon }) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex items-center gap-3 font-medium">
          <Icon aria-hidden className="size-4 shrink-0" />
          {label}
        </span>
        <span className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <span className="truncate">{value}</span>
          <ChevronRight aria-hidden className="size-4 shrink-0" />
        </span>
      </Link>
    </li>
  );
}

// Celular (canvas GMConta): lista de atalhos; cada linha abre a aba, e "Sair" fica no fim.
export function AccountMenuList({ sessionCount }: { sessionCount: number | null }) {
  const { t } = useTranslation();
  const { state } = useSession();
  const profile = useManagementProfile();
  const { logout, pending, failed } = useLogout();
  if (state.status !== "ready") return null;
  const { account, twoFactor } = state.session;
  const days = account.passwordChangedAt ? relativeDay(account.passwordChangedAt, new Date()) : null;
  const months = days === null ? 0 : Math.floor(days / 30);
  const password = days === null ? t("account.menu.passwordNever") : months >= 1 ? t("account.menu.passwordMonths", { count: months }) : t("account.menu.passwordRecent");
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-card border bg-card p-4">
        <Avatar name={account.name || account.email} decorative />
        <div className="min-w-0">
          <p className="truncate font-semibold">{account.name || account.email}</p>
          <p className="truncate text-sm text-muted-foreground">{account.email}</p>
          <p className="truncate text-sm text-muted-foreground">{profile.line}</p>
        </div>
      </div>
      <ul className="divide-y rounded-card border bg-card">
        <Row icon={UserRound} to="?aba=perfil" label={t("account.menu.profileRow")} />
        <Row icon={KeyRound} to="?aba=seguranca" label={t("account.menu.senha")} value={password} />
        <Row icon={Mail} to="?aba=seguranca" label={t("account.menu.email")} value={account.email} />
        <Row icon={ShieldCheck} to="?aba=seguranca" label={t("account.menu.twoFactor")} value={t(twoFactor.enabled ? "account.menu.on" : "account.menu.off")} />
        <Row icon={Smartphone} to="?aba=seguranca" label={t("account.menu.sessions")} value={sessionCount ?? ""} />
        <Row icon={Bell} to="?aba=notificacoes" label={t("account.menu.notifications")} />
        <Row icon={Lock} to="?aba=privacidade" label={t("account.menu.privacy")} />
      </ul>
      <Button type="button" variant="danger" className="min-h-11 w-full" disabled={pending} onClick={logout}>
        <LogOut aria-hidden />
        {pending ? t("auth.logout.pending") : t("account.menu.logout")}
      </Button>
      {failed && <LogoutError onRetry={logout} />}
    </div>
  );
}
