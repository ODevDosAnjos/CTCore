import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { iconFor } from "@/components/layout/icons";
import { ErrorState, LoadingState } from "@/components/states";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PageHeader } from "@/components/ui/page-header";
import { buildMenu } from "@/features/permissions/buildMenu";
import { usePermissions } from "@/features/permissions/usePermissions";

// Mesmo conjunto e ordem do grupo Configurações do menu (RF-ORG-09).
const ORDER = ["organizationSettings", "units", "subscription", "dataSecurity"];

function Content() {
  const { t } = useTranslation();
  const { status, permissions, retry } = usePermissions();
  if (!permissions) return status === "loading" ? <LoadingState /> : <ErrorState onRetry={retry} />;
  const allowed = buildMenu(permissions, t).find((g) => g.id === "settings")?.items ?? [];
  const items = ORDER.flatMap((id) => allowed.filter((i) => i.id === id));
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("settingsIndex.title")} />
      <Card>
        <ul className="flex flex-col divide-y">
          {items.map((item) => {
            const Icon = iconFor(item.icon);
            const label = t(`settingsIndex.items.${item.id}`);
            const body = (
              <>
                <Icon aria-hidden className="size-5 shrink-0" />
                <span className="min-w-0 flex-1">{label}</span>
              </>
            );
            return (
              <li key={item.id}>
                {item.disabled ? (
                  <div className="flex min-h-11 items-center gap-3 py-2">
                    <Icon aria-hidden className="size-5 shrink-0" />
                    <ComingSoon variant="link" label={label} />
                  </div>
                ) : (
                  <Link to={item.href} className="flex min-h-11 items-center gap-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {body}
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

// R8 (GMConfig): a lista de configurações que o perfil pode abrir; a permissão de cada rota continua no servidor.
export function SettingsIndexPage() {
  return <Content />;
}
