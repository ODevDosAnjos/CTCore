import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import type { TFunction } from "i18next";
import type { Column } from "@/components/query/DataTable";
import { QueryPage, type Query } from "@/components/query/QueryPage";
import { RowCard } from "@/components/query/RowCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PageHeader } from "@/components/ui/page-header";
import { PersonAvatar, PersonRow } from "@/components/ui/person-row";
import { PillFilter } from "@/components/ui/pill-filter";
import { QuickFilters } from "@/components/ui/quick-filters";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { formatDate } from "@/lib/format";
import { RefuseRequestDialog } from "./RefuseRequestDialog";
import { requestDeadline, requestDetail } from "./RequestSummary";
import { REQUEST_KINDS, type PortalRequest } from "./types";
import { approveRequest, fetchPortalRequests, useReachableUnits } from "./usePortalRequests";

// D6: Aprovar marca o pedido e leva ao fluxo da gestão já preenchido; a matrícula só muda quando a gestão conclui o fluxo.
export function flowOf(r: PortalRequest): string {
  if (r.kind === "NEW_MODALITY") return `/alunos/nova-matricula?aluno=${r.studentId}&unidade=${r.targetUnitId}&modalidade=${r.targetModalityId}`;
  return `/alunos/${r.studentId}?pedido=${r.id}`;
}

type Actions = { onApprove: (r: PortalRequest) => void; onRefuse: (r: PortalRequest) => void; busy: boolean };

function RowActions({ r, onApprove, onRefuse, busy }: { r: PortalRequest } & Actions) {
  const { t } = useTranslation();
  if (r.status !== "OPEN") return null;
  return (
    <span className="flex flex-wrap gap-2">
      {r.kind === "CLOSURE" ? (
        <Button asChild variant="outline" className="min-h-11">
          <Link to={`/alunos/${r.studentId}`} aria-label={t("portalRequests.actions.openRecordFor", { student: r.studentName })}>
            {t("portalRequests.actions.openRecord")}
          </Link>
        </Button>
      ) : (
        <Button className="min-h-11" disabled={busy} aria-label={t("portalRequests.actions.approveFor", { student: r.studentName })} onClick={() => onApprove(r)}>
          {t("portalRequests.actions.approve")}
        </Button>
      )}
      <Button variant="outline" className="min-h-11" aria-label={t("portalRequests.actions.refuseFor", { student: r.studentName })} onClick={() => onRefuse(r)}>
        {t("portalRequests.actions.refuse")}
      </Button>
    </span>
  );
}

const columns = (t: TFunction, a: Actions): Column<PortalRequest>[] => [
  {
    key: "student",
    label: t("portalRequests.columns.student"),
    render: (r) => (
      <PersonRow
        name={r.studentName}
        size="sm"
        title={
          <Link to={`/alunos/${r.studentId}`} className="inline-flex min-h-11 min-w-0 items-center break-words font-bold">
            {r.studentName}
          </Link>
        }
        secondary={r.unit}
      />
    ),
  },
  { key: "kind", label: t("portalRequests.columns.kind"), render: (r) => t(`portalRequests.kinds.${r.kind}`) },
  { key: "detail", label: t("portalRequests.columns.detail"), render: (r) => requestDetail(t, r) },
  { key: "date", label: t("portalRequests.columns.date"), render: (r) => formatDate(r.createdAt) },
  { key: "deadline", label: t("portalRequests.columns.deadline"), render: (r) => requestDeadline(t, r) },
  { key: "actions", label: t("portalRequests.columns.actions"), render: (r) => <RowActions r={r} {...a} /> },
];

const card = (t: TFunction, a: Actions) => (r: PortalRequest) => (
  <RowCard
    lead={<PersonAvatar name={r.studentName} size="sm" />}
    title={
      <Link to={`/alunos/${r.studentId}`} className="inline-flex min-h-11 items-center break-words font-bold">
        {r.studentName}
      </Link>
    }
    meta={
      <>
        <span>{r.unit}</span>
        <span>{t(`portalRequests.kinds.${r.kind}`)}</span>
        <span className="break-words">{requestDetail(t, r)}</span>
        <span>{t("portalRequests.cardDate", { date: formatDate(r.createdAt) })}</span>
        <span>{requestDeadline(t, r)}</span>
        <RowActions r={r} {...a} />
      </>
    }
  />
);

function Filters({ get, set, counts }: { get: (k: string) => string; set: (k: string, v: string) => void; counts?: Record<string, number> }) {
  const { t } = useTranslation();
  const units = useReachableUnits();
  return (
    <>
      <div className="min-w-0 max-w-full">
        <QuickFilters
          className="flex-nowrap overflow-x-auto sm:flex-wrap"
          value={get("kind")}
          onChange={(k) => set("kind", k)}
          options={[{ key: "", label: t("portalRequests.filters.all"), count: counts?.total }, ...REQUEST_KINDS.map((k) => ({ key: k, label: t(`portalRequests.kinds.${k}`), count: counts?.[k] }))]}
        />
      </div>
      <PillFilter label={t("portalRequests.filters.unit")} value={get("unitId")} onChange={(v) => set("unitId", v)} allLabel={t("query.allF")} options={units} />
    </>
  );
}

// Barra de abas do canvas: "Pedidos do portal N" é a tela; "Aguardando aprovação" é de sprint futura (Em breve, sem rota).
function TabBar({ total }: { total?: number }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("portalRequests.tabs.label")} className="flex flex-wrap items-center gap-4 border-b border-divider">
      <span aria-current="page" className="-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-brand px-1 text-sm font-medium">
        {t("portalRequests.tabs.requests")}
        {total !== undefined && <Badge tone="neutral">{total}</Badge>}
      </span>
      <ComingSoon variant="tab" label={t("portalRequests.tabs.pending")} className="border-0 px-1" />
    </nav>
  );
}

function Content() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [refusing, setRefusing] = useState<PortalRequest>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const [version, setVersion] = useState(0);
  // Nova identidade refaz a consulta depois de uma decisão, sem piscar a lista (o resultado anterior segue à vista).
  const fetchPage = useCallback(
    (q: Query) => {
      void version;
      return fetchPortalRequests(q);
    },
    [version],
  );
  // D6: sem janela; aprovar marca o pedido e já abre o fluxo.
  const approve = async (r: PortalRequest) => {
    setBusy(true);
    setFailure(undefined);
    try {
      void navigate(flowOf(await approveRequest(r.id, "")));
    } catch (e) {
      const status = (e as { status?: number }).status;
      setFailure(t(`portalRequests.errors.${status === 403 || status === 404 || status === 409 ? status : "generic"}`));
      setVersion((n) => n + 1);
    } finally {
      setBusy(false);
    }
  };
  const actions: Actions = { onApprove: (r) => void approve(r), onRefuse: setRefusing, busy };
  return (
    <div className="flex flex-col gap-4">
      <QueryPage
        search={false}
        canvasStates
        cardsBelow="sm"
        header={({ counts }) => (
          <>
            <PageHeader title={t("portalRequests.title")} subtitle={t("portalRequests.subtitle")} />
            <TabBar total={counts?.total} />
          </>
        )}
        columns={columns(t, actions)}
        cards={card(t, actions)}
        fetchPage={fetchPage}
        rowKey={(r) => r.id}
        filterKeys={["kind", "unitId"]}
        filters={(p) => <Filters {...p} />}
        texts={{ emptyTitle: t("portalRequests.emptyTitle"), emptyText: t("portalRequests.emptyText") }}
        footer={() => <p className="text-sm text-muted-foreground">{t("portalRequests.footerNote")}</p>}
      />
      {failure && (
        <p role="alert" className="text-sm text-danger-foreground">
          {failure}
        </p>
      )}
      {refusing && <RefuseRequestDialog request={refusing} onClose={() => setRefusing(undefined)} onDone={() => setVersion((n) => n + 1)} />}
    </div>
  );
}

// RF-MAT-04: lista de pedidos do portal com Aprovar e Recusar; a barreira de dados é o servidor (403 vira "sem permissão" na própria lista).
export function PortalRequestsPage() {
  return (
    <ManagementLayout activeId="requests">
      <Content />
    </ManagementLayout>
  );
}
