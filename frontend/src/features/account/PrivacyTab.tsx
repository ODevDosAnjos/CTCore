import { Download, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ComingSoon } from "@/components/ui/coming-soon";
import { MenuList, SoonRow } from "@/features/portal/PortalMenuRows";

// D7: os pedidos de dados são de sprint futura (issues 764, 117 e 118): visíveis, "Em breve" e sem chamar rota.
export function PrivacyTab({ portal }: { portal: boolean }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  if (portal && narrow)
    return (
      <MenuList label={t("account.portal.dataMenu")}>
        <SoonRow icon={Download} label={t("account.portal.download.title")} />
        <SoonRow icon={Trash2} label={t("account.portal.delete.title")} />
      </MenuList>
    );
  const cards = [
    { title: t("account.portal.download.title"), text: t(portal ? "account.portal.download.text" : "account.privacy.managementDownload") },
    ...(portal ? [{ title: t("account.portal.delete.title"), text: t("account.portal.delete.text") }] : []),
  ];
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <Card key={c.title} heading="h2" titleClassName={portal ? CARD_TITLE : undefined} title={c.title}>
          <p className="mb-3 text-sm text-muted-foreground">{c.text}</p>
          <ComingSoon tipAlign="end" variant="button" label={c.title} />
        </Card>
      ))}
    </div>
  );
}
