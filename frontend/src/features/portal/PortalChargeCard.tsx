import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { formatCurrency, formatDate } from "@/lib/format";
import { PixProofDialog } from "./PixProofDialog";
import type { HomeCharge } from "./usePortalHome";

type Props = { items: HomeCharge[]; nextDueOn: string | null; onChanged: () => void };

// RF-POR-02, RN-POR-04: a cobrança que pede ação em destaque ("Pagar" abre o Pix com comprovante, D10) ou "Tudo em dia". Meios de pagamento: Sprint 11 (Em breve).
export function PortalChargeCard({ items, nextDueOn, onChanged }: Props) {
  const { t } = useTranslation();
  const [paying, setPaying] = useState<string>();
  const main = items.find((c) => c.canPay) ?? items[0];
  const others = items.filter((c) => c !== main);

  if (!main)
    return (
      <Card heading="h2" title={t("portalHome.charges.title")} actions={<Badge tone="ok">{t("portalHome.charges.upToDate")}</Badge>}>
        {nextDueOn && <p className="text-muted-foreground">{t("portalHome.charges.nextDue", { date: formatDate(nextDueOn) })}</p>}
        <Link to="/portal/financeiro" className={`${buttonVariants({ variant: "secondary" })} mt-3 min-h-11 w-full`}>
          {t("portalHome.charges.viewFinance")}
        </Link>
      </Card>
    );

  const month = main.referenceMonth ? formatDate(main.referenceMonth).slice(3) : null;
  const heading = main.modality ? [main.modality.name, month].filter(Boolean).join(" · ") : (main.description ?? t("portalHome.charges.generic"));
  const what = main.description ?? heading;
  return (
    <Card heading="h2" title={heading} actions={<StatusBadge status={main.situation} label={t(`portalHome.charges.situation.${main.situation}`)} />}>
      <p className="text-3xl font-semibold">{formatCurrency(main.amountCents)}</p>
      <p className="text-muted-foreground">{t(main.situation === "OVERDUE" ? "portalHome.charges.overdueOn" : "portalHome.charges.dueOn", { date: formatDate(main.dueOn) })}</p>
      {others.length > 0 && <p className="text-muted-foreground">{t("portalHome.charges.alsoOpen", { value: formatCurrency(others.reduce((sum, c) => sum + c.amountCents, 0)) })}</p>}
      {main.canPay && (
        <Button className="mt-3 min-h-11 w-full" aria-label={t("portalHome.charges.payItem", { what })} onClick={() => setPaying(main.id)}>
          {t("portalHome.charges.pay")}
        </Button>
      )}
      <div className="mt-2">
        <ComingSoon variant="link" label={t("portalHome.charges.methods")} />
      </div>
      {paying && <PixProofDialog chargeIds={[paying]} onClose={() => setPaying(undefined)} onSent={onChanged} />}
    </Card>
  );
}
