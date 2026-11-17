import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { Badge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Switch } from "@/components/ui/switch";
import type { Draft, SetDraft } from "./unitDraft";

type LinkKey = "trialLinkEnabled" | "selfRegistrationLinkEnabled";
const LINKS: { key: LinkKey; id: "trial" | "selfRegistration" }[] = [
  { key: "trialLinkEnabled", id: "trial" },
  { key: "selfRegistrationLinkEnabled", id: "selfRegistration" },
];

// Aba Links (R7): o interruptor liga e desliga o link público; endereço, QR e PDF chegam com a tela de links (issue 162).
export function UnitLinksTab({ d, set }: { d: Draft; set: SetDraft }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      {LINKS.map(({ key, id }) => (
        <Card key={id}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{t(`unitSettings.links.${id}.title`)}</h2>
                {d[key] && <Badge tone="ok">{t("unitSettings.links.on")}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{t(`unitSettings.links.${id}.text`)}</p>
            </div>
            <Switch label={t(`unitSettings.links.${id}.title`)} checked={d[key]} onCheckedChange={set(key)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <ComingSoon variant="button" label={t("unitSettings.links.copy")} />
            <ComingSoon variant="link" label={t("unitSettings.links.qr")} />
            <ComingSoon variant="link" label={t("unitSettings.links.pdf")} />
          </div>
        </Card>
      ))}
      <p className="text-sm text-muted-foreground">{t("unitSettings.links.offNote")}</p>
    </div>
  );
}
