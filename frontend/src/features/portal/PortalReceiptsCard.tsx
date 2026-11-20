import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { useSession } from "@/features/auth/SessionProvider";

// RN-COB-16, D4: o recibo é sempre emitido; o cartão só informa o e-mail da conta (sem interruptor nem dado novo).
export function PortalReceiptsCard() {
  const { t } = useTranslation();
  const { state } = useSession();
  const email = state.status === "ready" ? state.session.account.email : "";
  return (
    <section aria-label={t("portalFinance.receipts.title")}>
      <Card className="flex flex-wrap items-center gap-3">
        <Mail aria-hidden="true" className="size-5 shrink-0" />
        <div className="min-w-32 flex-1">
          <h2 className="text-base font-semibold">
            {t("portalFinance.receipts.title")}
          </h2>
          <p className="break-words text-sm text-muted-foreground">
            {t("portalFinance.receipts.text", { email })}
          </p>
        </div>
      </Card>
    </section>
  );
}
