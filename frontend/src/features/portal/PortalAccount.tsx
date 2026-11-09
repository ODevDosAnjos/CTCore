import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Avatar } from "@/components/ui/avatar";

/** Conta na barra do portal: avatar com iniciais e, a partir de 768 px, nome e perfil; leva a `/conta` (canvas PortalNav). */
export function PortalAccount({ name, roleLabel }: { name: string; roleLabel: string }) {
  const { t } = useTranslation();
  return (
    <Link to="/conta" className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="sr-only">{t("account.link")}</span>
      <Avatar name={name} decorative />
      <span className="hidden min-w-0 text-left leading-tight md:block">
        <span className="block max-w-40 truncate font-medium">{name}</span>
        <span className="block text-xs opacity-80">{roleLabel}</span>
      </span>
    </Link>
  );
}
