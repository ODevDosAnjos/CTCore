import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { DataTable, type Column } from "@/components/query/DataTable";
import { useBelowSm } from "@/components/query/useBelowSm";
import { RowCard } from "@/components/query/RowCard";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import type { Tone } from "@/components/ui/status-tone";
import { requestDeadline, requestDetail } from "@/features/portal-requests/RequestSummary";
import type { PortalRequest } from "@/features/portal-requests/types";
import { formatDate } from "@/lib/format";

// Nota sob a situação (R5, D11): prazo do aberto e resposta da academia no recusado; aprovado, expirado e encerrado só a situação.
function note(t: TFunction, r: PortalRequest): string | null {
  if (r.status === "OPEN") return requestDeadline(t, r);
  if (r.status === "REFUSED" && r.response) return t("portalOwn.notes.response", { response: r.response });
  return null;
}

// Tom de cada situação no canvas do portal: aguardando âmbar, aprovado verde, o resto neutro.
const TONE: Record<string, Tone> = { OPEN: "warn", APPROVED: "ok" };
const status = (t: TFunction, r: PortalRequest, short = false) => <Badge tone={TONE[r.status] ?? "neutral"}>{short && r.status === "OPEN" ? t("portalOwn.statusesShort.OPEN") : t(`portalOwn.statuses.${r.status}`)}</Badge>;

// Detalhe da linha: o da gestão, e o do encerramento sem o prazo (a nota já o traz); no celular a data entra no fim.
const detail = (t: TFunction, r: PortalRequest, short = false): string => {
  const text = r.kind === "CLOSURE" ? t("portalOwn.detailClosure", { modality: r.modality ?? "", reason: t(`students.record.enrollment.end.reasons.${r.reason}`).toLocaleLowerCase("pt-BR") }) : requestDetail(t, r);
  return short ? `${text} · ${formatDate(r.createdAt).slice(0, 5)}` : text;
};

export function PortalMyRequests({ requests }: { requests: PortalRequest[] }) {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const columns: Column<PortalRequest>[] = [
    { key: "kind", label: t("portalOwn.columns.kind"), render: (r) => <span className="font-medium">{t(`portalRequests.kinds.${r.kind}`)}</span> },
    { key: "detail", label: t("portalOwn.columns.detail"), render: (r) => detail(t, r) },
    { key: "sent", label: t("portalOwn.columns.sent"), render: (r) => formatDate(r.createdAt) },
    {
      key: "status",
      label: t("portalOwn.columns.status"),
      render: (r) => status(t, r),
    },
    { key: "note", label: t("portalOwn.columns.note"), hideLabel: true, render: (r) => <span className="text-muted-foreground">{note(t, r)}</span> },
  ];
  if (requests.length === 0) {
    return (
      <Card heading="h2" title={t("portalOwn.listTitle")} titleClassName="font-sans tracking-normal">
        <EmptyState title={t("portalOwn.emptyTitle")} text={t("portalOwn.emptyText")} />
      </Card>
    );
  }
  // Celular (canvas PortalMPedidos): título solto e um cartão por pedido, com o selo na linha do título.
  if (narrow) {
    return (
      <section aria-labelledby="portal-my-requests" className="flex flex-col gap-3">
        <h2 id="portal-my-requests" className="font-sans text-base font-semibold tracking-normal">
          {t("portalOwn.listTitle")}
        </h2>
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg border bg-card p-4">
              <RowCard
                title={
                  <span className="flex items-start justify-between gap-2">
                    <span>{t(`portalRequests.kinds.${r.kind}`)}</span>
                    {status(t, r, true)}
                  </span>
                }
                meta={
                  <>
                    <span className="break-words">{detail(t, r, true)}</span>
                    {note(t, r) && <span className="break-words">{note(t, r)}</span>}
                  </>
                }
              />
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <Card heading="h2" title={t("portalOwn.listTitle")} titleClassName="font-sans tracking-normal">
      <DataTable columns={columns} rows={requests} rowKey={(r) => r.id} order="" onOrder={() => undefined} />
    </Card>
  );
}
