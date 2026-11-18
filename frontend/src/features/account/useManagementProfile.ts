import { useTranslation } from "react-i18next";
import { useSession } from "@/features/auth/SessionProvider";

/** Nome, perfil e unidades do vínculo ativo da gestão, para o subtítulo da página e o cartão do celular. */
export function useManagementProfile() {
  const { t } = useTranslation();
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const link = session?.links.find((l) => l.id === session.activeLinkId);
  const name = session?.account.name || session?.account.email || "";
  const role = link ? t(`layout.roles.${link.role}`) : "";
  const units = link?.unitNames ?? [];
  const list = units.join(", ");
  return {
    subtitle: units.length ? t("account.subtitle", { count: units.length, name, role, units: list }) : t("account.subtitleNoUnits", { name, role }),
    line: units.length ? t("account.menu.profile", { role, units: list }) : t("account.menu.profileNoUnits", { role }),
  };
}
