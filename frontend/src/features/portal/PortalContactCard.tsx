import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { useBelowSm } from "@/components/query/useBelowSm";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { formatPhoneDisplay } from "@/lib/format";
import type { PortalShellData } from "./usePortalShell";

// RF-POR-05, RN-INA-08: "Fale com a academia" no Financeiro reduzido. Contato público da unidade de cadastro; o que não está cadastrado não aparece e, sem unidade, o cartão some.
export function PortalContactCard({ unit }: { unit?: PortalShellData["unit"] }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  if (!unit) return null;
  const k = "portalFinance.contact.";
  const lines = narrow ? [] : [unit.whatsapp ? formatPhoneDisplay(unit.whatsapp) : null, unit.email].filter(Boolean);
  return (
    <Card heading="h2" title={t(`${k}title`)} titleClassName={CARD_TITLE}>
      <p className="text-sm text-muted-foreground">{t(`${k}${narrow ? "textShort" : "text"}`, { unit: unit.name })}</p>
      {unit.whatsapp && <WhatsAppButton phone={unit.whatsapp} variant="whatsapp" label={t(`${k}whatsapp`)} ariaLabel={t(`${k}whatsapp`)} className="mt-3 w-full" />}
      {lines.length > 0 && <p className="mt-3 break-words text-sm">{lines.join(" · ")}</p>}
    </Card>
  );
}
