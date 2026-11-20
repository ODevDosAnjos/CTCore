import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ComingSoon } from "@/components/ui/coming-soon";

// RF-POR-05, D3: cartão informativo, uma linha como o canvas; ativar, trocar e desativar chegam com o pagamento online (Sprint 11). "Ativar" é "Em breve", sem chamada de rede.
export function PortalAutoDebitCard() {
  const { t } = useTranslation();
  return (
    <section aria-label={t("portalFinance.autoDebit.title")}>
      <Card className="flex flex-wrap items-center gap-3">
        <RefreshCw aria-hidden="true" className="size-5 shrink-0" />
        <div className="min-w-32 flex-1">
          <h2 className="text-base font-semibold">
            {t("portalFinance.autoDebit.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              {t("portalFinance.autoDebit.text")}
            </span>
            <span className="sm:hidden">
              {t("portalFinance.autoDebit.off")}
            </span>
          </p>
        </div>
        <ComingSoon
          variant="button"
          label={t("portalFinance.autoDebit.activate")}
        />
      </Card>
    </section>
  );
}
