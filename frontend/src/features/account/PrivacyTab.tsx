import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CARD_TITLE, Card } from "@/components/Card";
import { useBelowSm } from "@/components/query/useBelowSm";
import { ErrorState, ForbiddenState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { useSession } from "@/features/auth/SessionProvider";
import { MenuList, SoonRow } from "@/features/portal/PortalMenuRows";
import { ApiError, api } from "@/lib/api";

// RF-LGP-01: o arquivo é montado no navegador a partir da resposta e salvo por um link criado no código.
function DownloadData() {
  const { t } = useTranslation();
  const { refresh } = useSession();
  const [phase, setPhase] = useState<"idle" | "preparing" | "failed" | "forbidden">("idle");

  async function download() {
    setPhase("preparing");
    try {
      const data = await api<unknown>("/auth/data-export");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = t("account.privacy.fileName");
      a.click();
      URL.revokeObjectURL(url);
      setPhase("idle");
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      if (status === 401) void refresh(); // sessão expirada: volta ao login
      else setPhase(status === 403 ? "forbidden" : "failed");
    }
  }

  if (phase === "forbidden") return <ForbiddenState />;
  if (phase === "failed") return <ErrorState onRetry={() => void download()} />;
  return (
    <Button variant="secondary" icon={<Download />} disabled={phase === "preparing"} onClick={() => void download()}>
      {t(phase === "preparing" ? "account.privacy.preparing" : "account.portal.download.title")}
    </Button>
  );
}

// A gestão baixa os dados da conta (issue 764). No portal os pedidos de dados são de sprint futura (issues 117 e 118): visíveis, "Em breve" e sem chamar rota.
export function PrivacyTab({ portal }: { portal: boolean }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  if (portal && narrow)
    return (
      <MenuList label={t("account.portal.dataMenu")}>
        <SoonRow icon={Download} label={t("account.portal.download.title")} />
        <SoonRow icon={Trash2} label={t("account.portal.delete.title")} />
      </MenuList>
    );
  const cards = [
    { title: t("account.portal.download.title"), text: t(portal ? "account.portal.download.text" : "account.privacy.managementDownload") },
    ...(portal ? [{ title: t("account.portal.delete.title"), text: t("account.portal.delete.text") }] : []),
  ];
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {cards.map((c) => (
        <Card key={c.title} heading="h2" titleClassName={portal ? CARD_TITLE : undefined} title={c.title}>
          <p className="mb-3 text-sm text-muted-foreground">{c.text}</p>
          {portal ? <ComingSoon tipAlign="end" variant="button" label={c.title} /> : <DownloadData />}
        </Card>
      ))}
    </div>
  );
}
