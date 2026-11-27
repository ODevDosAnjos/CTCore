import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { RelativeDate } from "@/components/RelativeDate";
import { ErrorState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AccountSessionItem } from "./useAccount";

const MOBILE = /iphone|ipad|android|ios/i;

function DeviceIcon({ device, className }: { device: string; className?: string }) {
  const Icon = MOBILE.test(device) ? Smartphone : Monitor;
  return <Icon aria-hidden className={cn("shrink-0 text-muted-foreground", className)} />;
}

function DeviceName({ s, current, tone = "info" }: { s: AccountSessionItem; current: string; tone?: "info" | "ok" }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <DeviceIcon device={s.device} className="size-4" />
      <span className="break-words">{s.device}</span>
      {s.current && <Badge tone={tone}>{current}</Badge>}
    </span>
  );
}

// RF-ACE-04: a lista nunca traz token nem IP; a sessão em uso não se encerra aqui (D7, existe "Sair").
export function SessionsSection({
  status,
  items,
  reload,
  portal = false,
}: {
  status: "loading" | "ready" | "error";
  items: AccountSessionItem[];
  reload: () => void;
  /** Canvas PortalConta: sem coluna de local, nota dos 30 dias e "Encerrar todas as outras" em vermelho. */
  portal?: boolean;
}) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const [confirmAll, setConfirmAll] = useState(false);
  const [failed, setFailed] = useState(false);
  const others = items.filter((s) => !s.current);

  async function end(id: string) {
    setFailed(false);
    try {
      await api<void>(`/auth/sessions/${id}`, { method: "DELETE" });
    } catch {
      setFailed(true);
    }
    reload();
  }

  async function endAll() {
    await api<void>("/auth/sessions", { method: "DELETE" }); // se falhar, a janela segue aberta
    reload();
  }

  const rows = portal && narrow; // canvas PortalMConta: linhas com ícone, "Encerrar" sem borda e o botão em vermelho no fim
  const endButton = (s: AccountSessionItem) =>
    !s.current && (
      <Button variant={rows ? "ghost" : "secondary"} onClick={() => void end(s.id)} aria-label={t("account.sessions.endOne", { device: s.device })}>
        {t("account.sessions.end")}
      </Button>
    );

  return (
    <Card
      title={t("account.sessions.title")}
      heading="h2"
      titleClassName={portal ? CARD_TITLE : undefined}
      actions={
        others.length > 0 &&
        !rows && (
          <Button variant={portal ? "danger" : "secondary"} onClick={() => setConfirmAll(true)}>
            {t("account.sessions.endAll")}
          </Button>
        )
      }
    >
      {status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState onRetry={reload} />
      ) : (
        <>
          {failed && (
            <Banner tone="danger" className="mb-2">
              {t("account.sessions.endFailed")}
            </Banner>
          )}
          {narrow ? (
            <ul aria-label={t("account.sessions.list")} className="divide-y">
              {items.map((s) => (
                <li key={s.id} className="py-3">
                  {rows ? (
                    <RowCard
                      lead={<DeviceIcon device={s.device} className="mt-0.5 size-[18px]" />}
                      title={s.device}
                      meta={<RelativeDate value={s.lastUsedAt} />}
                      action={s.current ? <Badge tone="ok">{t("account.sessions.current")}</Badge> : endButton(s)}
                    />
                  ) : (
                    <RowCard
                      title={<DeviceName s={s} current={t("account.sessions.current")} tone={portal ? "ok" : "info"} />}
                      meta={
                        <>
                          {!portal && s.city && <span>{s.city}</span>}
                          <span>
                            {t("account.sessions.lastUse")}: <RelativeDate value={s.lastUsedAt} />
                          </span>
                        </>
                      }
                      action={endButton(s)}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("account.sessions.device")}</th>
                  {!portal && <th scope="col" className="py-2 pr-3 font-medium">{t("account.sessions.place")}</th>}
                  <th scope="col" className="py-2 pr-3 font-medium">{t("account.sessions.lastUse")}</th>
                  <th scope="col" className="py-2"><span className="sr-only">{t("account.sessions.actions")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3 font-medium"><DeviceName s={s} current={t("account.sessions.current")} tone={portal ? "ok" : "info"} /></td>
                    {!portal && <td className="py-2 pr-3 text-muted-foreground">{s.city ?? t("format.empty")}</td>}
                    <td className="py-2 pr-3"><RelativeDate value={s.lastUsedAt} /></td>
                    <td className="py-2 text-right">{endButton(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {others.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{t("account.sessions.empty")}</p>}
          {rows && others.length > 0 && (
            <Button variant="danger" className="mt-3 w-full" onClick={() => setConfirmAll(true)}>
              {t("account.sessions.endAll")}
            </Button>
          )}
        </>
      )}
      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title={t("account.sessions.endAllTitle")}
        summary={t("account.sessions.endAllSummary")}
        confirmLabel={t("account.sessions.endAll")}
        onConfirm={endAll}
      />
    </Card>
  );
}
