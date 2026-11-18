import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { Switch } from "@/components/ui/switch";
import { useNotificationPrefs } from "./useNotificationPrefs";

function Item({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// Aba Notificações (canvas MinhaContaNotificacoes). "Receber tudo" só muda para o Coordenador (RN-NOT-03); o resto é item futuro (decisão 9).
export function NotificationsTab() {
  const { t } = useTranslation();
  const p = useNotificationPrefs();
  if (p.status === "loading") return <LoadingState />;
  if (p.status === "forbidden") return <ForbiddenState />;
  if (p.status === "error" || !p.prefs) return <ErrorState onRetry={p.retry} />;
  const can = p.prefs.canReceiveAll;
  return (
    <div className="space-y-4">
      <Card title={t("account.notifications.bell.title")} heading="h2">
        <div className="divide-y">
          <Item title={t("account.notifications.bell.unit")} hint={t("account.notifications.bell.unitHint")}>
            <Switch checked disabled onCheckedChange={() => undefined} label={t("account.notifications.bell.unit")} />
          </Item>
          <Item title={t("account.notifications.bell.receiveAll")} hint={t(can ? "account.notifications.bell.receiveAllHint" : "account.notifications.bell.receiveAllLocked")}>
            <Switch checked={p.receiveAll} disabled={!can} onCheckedChange={p.setReceiveAll} label={t("account.notifications.bell.receiveAll")} />
          </Item>
        </div>
      </Card>
      <Card title={t("account.notifications.daily.title")} heading="h2">
        <ComingSoon variant="switch" label={t("account.notifications.daily.label")} />
      </Card>
      <Card title={t("account.notifications.welcome.title")} heading="h2">
        <ComingSoon variant="switch" label={t("account.notifications.welcome.label")} />
      </Card>
      {p.saveFailed && <Banner tone="danger">{t("account.notifications.saveFailed")}</Banner>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" disabled={!p.dirty || p.saving} onClick={p.discard}>
          {t("account.notifications.discard")}
        </Button>
        <Button disabled={!p.dirty || p.saving} onClick={() => void p.save()}>
          {p.saving ? t("account.notifications.saving") : t("account.notifications.save")}
        </Button>
      </div>
    </div>
  );
}
