import { ArrowLeftRight, Ban, FileText, Plus, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Button } from "@/components/ui/button";
import type { PortalRequestKind } from "@/features/portal-requests/types";

const CARDS: { kind: PortalRequestKind; icon: LucideIcon }[] = [
  { kind: "CLASS_CHANGE", icon: ArrowLeftRight },
  { kind: "NEW_MODALITY", icon: Plus },
  { kind: "PLAN_CHANGE", icon: FileText },
  { kind: "CLOSURE", icon: Ban },
];

// Quatro cartões de ação (canvas): lado a lado a 1440 px (ícone, título, apoio e "Pedir"); 2x2 no celular só com ícone e título.
export function PortalRequestCards({ canPick, canOffer, onPick }: { canPick: boolean; canOffer: boolean; onPick: (kind: PortalRequestKind) => void }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  return (
    <ul aria-label={t("portalOwn.cardsLabel")} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ kind, icon: Icon }) => {
        const title = t(`portalOwn.cards.${kind}.title`);
        const disabled = kind === "NEW_MODALITY" ? !canOffer : !canPick;
        return (
          <li key={kind} className="flex">
            {narrow ? (
              <button type="button" disabled={disabled} aria-label={t("portalOwn.askFor", { title })} onClick={() => onPick(kind)} className="flex min-h-11 w-full flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
                <Icon aria-hidden className="size-5 text-muted-foreground" />
                {title}
              </button>
            ) : (
              <div className="flex w-full flex-col items-start gap-2 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3">
                  <Icon aria-hidden className="size-5" />
                  <h2 className="font-sans text-base font-semibold tracking-normal">{title}</h2>
                </div>
                <p className="text-sm text-muted-foreground">{t(`portalOwn.cards.${kind}.hint`)}</p>
                <Button variant="outline" size="sm" className="self-start" disabled={disabled} aria-label={t("portalOwn.askFor", { title })} onClick={() => onPick(kind)}>
                  {t("portalOwn.ask")}
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
