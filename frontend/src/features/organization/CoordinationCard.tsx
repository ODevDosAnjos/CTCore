import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TransferCoordinationDialog } from "./TransferCoordinationDialog";
import type { Coordinator } from "./useOrganization";

// RF-ORG-06: quem coordena hoje; só o Coordenador vê o botão de transferir (o servidor confere de novo).
export function CoordinationCard({ coordinator, canTransfer, onDone }: { coordinator: Coordinator | null; canTransfer: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const name = coordinator?.name || coordinator?.email || "";
  return (
    <Card heading="h2" title={t("organization.coordination.title")}>
      <div className="flex flex-wrap items-center gap-3">
        {coordinator ? (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={name} decorative size="md" className="size-10 text-sm" />
            <div className="flex min-w-0 flex-col leading-snug">
              <span className="truncate font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">
                {t("organization.coordination.line", {
                  email: coordinator.email,
                  state: t(coordinator.twoFactorEnabled ? "organization.coordination.twoFactorOn" : "organization.coordination.twoFactorOff"),
                })}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("organization.coordination.none")}</p>
        )}
        {canTransfer && (
          <Button variant="danger" size="sm" className="ml-auto" onClick={() => setOpen(true)}>
            {t("organization.transfer.open")}
          </Button>
        )}
      </div>
      {canTransfer && <TransferCoordinationDialog open={open} onClose={() => setOpen(false)} onDone={onDone} />}
    </Card>
  );
}
