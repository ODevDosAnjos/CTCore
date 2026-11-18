import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { RelativeDate } from "@/components/RelativeDate";
import { ErrorState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { AccountSessionItem } from "./useAccount";

const MOBILE = /iphone|ipad|android|ios/i;

function DeviceName({ s, current }: { s: AccountSessionItem; current: string }) {
  const Icon = MOBILE.test(s.device) ? Smartphone : Monitor;
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className="break-words">{s.device}</span>
      {s.current && <Badge tone="info">{current}</Badge>}
    </span>
  );
}

// RF-ACE-04: a lista nunca traz token nem IP; a sessão em uso não se encerra aqui (D7, existe "Sair").
export function SessionsSection({
  status,
  items,
  reload,
}: {
  status: "loading" | "ready" | "error";
  items: AccountSessionItem[];
  reload: () => void;
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

  const endButton = (s: AccountSessionItem) =>
    !s.current && (
      <Button variant="secondary" onClick={() => void end(s.id)} aria-label={t("account.sessions.endOne", { device: s.device })}>
        {t("account.sessions.end")}
      </Button>
    );

  return (
    <Card
      title={t("account.sessions.title")}
      heading="h2"
      actions={
        others.length > 0 && (
          <Button variant="secondary" onClick={() => setConfirmAll(true)}>
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
                  <RowCard
                    title={<DeviceName s={s} current={t("account.sessions.current")} />}
                    meta={
                      <>
                        {s.city && <span>{s.city}</span>}
                        <span>
                          {t("account.sessions.lastUse")}: <RelativeDate value={s.lastUsedAt} />
                        </span>
                      </>
                    }
                    action={endButton(s)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">{t("account.sessions.device")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("account.sessions.place")}</th>
                  <th scope="col" className="py-2 pr-3 font-medium">{t("account.sessions.lastUse")}</th>
                  <th scope="col" className="py-2"><span className="sr-only">{t("account.sessions.actions")}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 pr-3 font-medium"><DeviceName s={s} current={t("account.sessions.current")} /></td>
                    <td className="py-2 pr-3 text-muted-foreground">{s.city ?? t("format.empty")}</td>
                    <td className="py-2 pr-3"><RelativeDate value={s.lastUsedAt} /></td>
                    <td className="py-2 text-right">{endButton(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {others.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{t("account.sessions.empty")}</p>}
          <p className="mt-3 text-sm text-muted-foreground">{t("account.sessions.note")}</p>
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
