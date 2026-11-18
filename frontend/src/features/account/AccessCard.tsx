import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/SessionProvider";
import { formatDate } from "@/lib/format";
import { ChangeEmailForm } from "./ChangeEmailForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

// Aba Acesso (canvas MinhaConta): e-mail e data da senha; trocar abre a janela com o formulário (RN-ACE-15, RN-ACE-20).
export function AccessCard({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  const { t } = useTranslation();
  const { state } = useSession();
  const [dialog, setDialog] = useState<"password" | "email" | null>(null);
  if (state.status !== "ready") return null;
  const { email, passwordChangedAt } = state.session.account;
  return (
    <Card title={t("account.access.title")} heading="h2">
      <div className="space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">{t("account.access.email")}</dt>
            <dd className="break-words font-medium">{email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("account.access.password")}</dt>
            <dd className="font-medium">{passwordChangedAt ? t("account.access.changedAt", { date: formatDate(passwordChangedAt) }) : t("account.access.never")}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setDialog("email")}>
            {t("account.access.changeEmail")}
          </Button>
          <Button variant="secondary" onClick={() => setDialog("password")}>
            {t("account.access.changePassword")}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t("account.access.note")}</p>
      </div>
      <Modal open={dialog === "password"} onOpenChange={(o) => !o && setDialog(null)} title={t("account.password.modalTitle")} size="sm">
        <ChangePasswordForm onChanged={onPasswordChanged} />
      </Modal>
      <Modal open={dialog === "email"} onOpenChange={(o) => !o && setDialog(null)} title={t("account.email.modalTitle")} size="sm">
        <ChangeEmailForm />
      </Modal>
    </Card>
  );
}
