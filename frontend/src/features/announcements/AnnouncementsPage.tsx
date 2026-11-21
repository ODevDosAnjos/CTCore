import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PageHeader } from "@/components/ui/page-header";
import { QueryPage } from "@/components/query/QueryPage";
import { RowCard } from "@/components/query/RowCard";
import type { Column } from "@/components/query/DataTable";
import { useBelowMd } from "@/components/query/useBelowSm";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { formatDate, formatTime } from "@/lib/format";
import { AnnouncementFilters } from "./AnnouncementFilters";
import { CancelAnnouncementDialog } from "./CancelAnnouncementDialog";
import { OrganizationAnnouncementDialog } from "./OrganizationAnnouncementDialog";
import type { AnnouncementItem } from "./types";
import { fetchAnnouncements, useDailyLimit } from "./useAnnouncements";

const DEFAULT_LIMIT = 20;

function useCells() {
  const { t } = useTranslation();
  const day = (iso: string) => formatDate(iso).slice(0, 5);
  return {
    target: (a: AnnouncementItem) => t(`announcements.targetList.${a.target.kind}`, { name: a.target.name }),
    // Linha de apoio do cartão: a turma pelo nome; os demais destinos pelo texto da lista.
    cardTarget: (a: AnnouncementItem) => (a.target.kind === "CLASS" && a.target.name ? a.target.name : t(`announcements.targetList.${a.target.kind}`, { name: a.target.name })),
    date: (a: AnnouncementItem) => (a.status === "SCHEDULED" ? t("announcements.dateScheduled", { date: day(a.date) }) : t("announcements.dateSent", { date: day(a.date), time: formatTime(a.date) })),
    cardDate: (a: AnnouncementItem) => (a.status === "SCHEDULED" ? t("announcements.dateScheduledMobile", { date: day(a.date), time: formatTime(a.date).replace("h00", "h") }) : day(a.date)),
    recipients: (a: AnnouncementItem) => (a.recipients === null ? t("format.empty") : String(a.recipients)),
    // D2: o percentual é reads / recipients arredondado, calculado aqui; no agendado, traço.
    reads: (a: AnnouncementItem) => (a.status === "SCHEDULED" || !a.recipients ? t("format.empty") : t("announcements.readsPercent", { count: a.reads, percent: Math.round((a.reads / a.recipients) * 100) })),
    cardReads: (a: AnnouncementItem) => t("announcements.readsOf", { reads: a.reads, total: a.recipients ?? 0 }),
  };
}

function CancelButton({ row, onCancel }: { row: AnnouncementItem; onCancel: (a: AnnouncementItem) => void }) {
  const { t } = useTranslation();
  if (row.status !== "SCHEDULED") return null;
  return (
    <Button type="button" variant="ghost" size="sm" className="underline" aria-label={t("announcements.cancel.actionFor", { title: row.title })} onClick={() => onCancel(row)}>
      {t("announcements.cancel.action")}
    </Button>
  );
}

function Card({ row, onCancel }: { row: AnnouncementItem; onCancel: (a: AnnouncementItem) => void }) {
  const { t } = useTranslation();
  const cells = useCells();
  const line = [cells.cardTarget(row), cells.cardDate(row), row.status === "SCHEDULED" ? row.author : cells.cardReads(row)];
  return (
    <RowCard
      title={
        <span className="flex flex-col gap-1.5">
          <span className="flex flex-wrap gap-1.5">
            <Badge tone="neutral">{t(`announcements.types.${row.type}`)}</Badge>
            <StatusBadge status={row.status} label={t(`announcements.status.${row.status}`)} />
          </span>
          <span className="font-semibold">{row.title}</span>
        </span>
      }
      meta={<span>{line.join(" · ")}</span>}
      action={<CancelButton row={row} onCancel={onCancel} />}
    />
  );
}

function Content() {
  const { t } = useTranslation();
  const cells = useCells();
  const narrow = useBelowMd();
  const [cancelling, setCancelling] = useState<AnnouncementItem | null>(null);
  const [version, setVersion] = useState(0);
  const navigate = useNavigate();
  const [query, setQuery] = useSearchParams();
  const orgOpen = query.get("novo") === "organizacao";
  // A contagem do dia é da unidade escolhida na barra; em "todas as unidades" não há contagem.
  const scope = useUnitScope();
  const unitId = scope.selected && scope.selected !== ALL ? scope.selected : undefined;
  const unitName = scope.units.find((u) => u.id === unitId)?.name;
  const daily = useDailyLimit(unitId, version);
  const limit = daily?.unit.limit ?? DEFAULT_LIMIT;
  const used = daily?.unit.used ?? 0;
  const full = used >= limit;
  // Confirmação vinda de /comunicados/novo (RF-COM-02): o estado da navegação traz o resultado e o link do grupo, se o WhatsApp foi escolhido.
  const sent = (useLocation().state as { sent?: { status: "SENT" | "SCHEDULED"; groupLink?: string | null } } | null)?.sent;
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const columns: Column<AnnouncementItem>[] = [
    { key: "date", label: t("announcements.columns.date"), sortable: true, render: cells.date },
    { key: "target", label: t("announcements.columns.target"), render: cells.target },
    {
      key: "title",
      label: t("announcements.columns.title"),
      sortable: true,
      render: (a) => (
        <>
          <span className="font-semibold">{a.title}</span>
          {a.pinnedUntil && <span className="ml-2 text-xs text-muted-foreground">{t("announcements.pinnedUntil", { date: formatDate(a.pinnedUntil).slice(0, 5) })}</span>}
        </>
      ),
    },
    { key: "type", label: t("announcements.columns.type"), sortable: true, render: (a) => <Badge tone="neutral">{t(`announcements.types.${a.type}`)}</Badge> },
    { key: "author", label: t("announcements.columns.author"), render: (a) => a.author },
    {
      key: "status",
      label: t("announcements.columns.status"),
      render: (a) => (
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge status={a.status} label={t(`announcements.status.${a.status}`)} />
          <CancelButton row={a} onCancel={setCancelling} />
          {a.status === "SCHEDULED" && <ComingSoon variant="link" label={t("announcements.edit")} />}
        </span>
      ),
    },
    { key: "recipients", label: t("announcements.columns.recipients"), render: cells.recipients },
    { key: "reads", label: t("announcements.columns.reads"), render: cells.reads },
  ];

  const reason = t("announcements.limitReason", { limit });
  const newButton = full ? (
    <Button type="button" disabled disabledReason={reason} className={narrow ? "min-h-11 w-full" : "min-h-11"}>
      <Plus aria-hidden="true" />
      {t("announcements.newAction")}
    </Button>
  ) : (
    <Button asChild className={narrow ? "min-h-11 w-full" : "min-h-11"}>
      <Link to="/comunicados/novo">
        <Plus aria-hidden="true" />
        {t("announcements.newAction")}
      </Link>
    </Button>
  );
  const emptyAction = full ? undefined : newButton;

  let subtitle: string;
  if (unitName && used > 0) subtitle = t(narrow ? "announcements.subtitleMobile" : "announcements.subtitleUsed", { unit: unitName, used, limit });
  else if (narrow) subtitle = unitName ?? t("announcements.scopeAll");
  else subtitle = t("announcements.subtitle", { scope: unitName ? t("announcements.scopeUnit", { unit: unitName }) : t("announcements.scopeAll"), limit });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={t("announcements.title")} subtitle={subtitle} actions={narrow ? undefined : newButton} />
      {narrow && newButton}
      {full && unitName && <Banner tone="warn">{t("announcements.limitBanner", { unit: unitName, limit })}</Banner>}
      {sent && (
        <p role="status" className="flex flex-wrap items-center gap-3 rounded-md border p-3">
          {t(sent.status === "SENT" ? "announcements.sentNotice" : "announcements.scheduledNotice")}
          {sent.groupLink && (
            <a className="underline" href={sent.groupLink} target="_blank" rel="noopener noreferrer">
              {t("announcements.openGroup")}
            </a>
          )}
        </p>
      )}
      <QueryPage
        key={version}
        columns={columns}
        fetchPage={fetchAnnouncements}
        rowKey={(a) => a.id}
        search={false}
        pagerOnlyIfNeeded
        tableCard
        filterKeys={["from", "to", "classId", "type"]}
        filters={({ get, set }) => <AnnouncementFilters get={get} set={set} />}
        emptyAction={emptyAction}
        texts={{ emptyTitle: t("announcements.emptyTitle"), emptyText: t("announcements.emptyText"), noResultTitle: t("announcements.noResultTitle"), noResultText: t("announcements.noResultText") }}
        cards={(a) => <Card row={a} onCancel={setCancelling} />}
        footer={() => <p className="text-sm text-muted-foreground">{t("announcements.note")}</p>}
      />
      {orgOpen && (
        <OrganizationAnnouncementDialog
          unitId={unitId}
          onClose={() =>
            setQuery(
              (q) => {
                q.delete("novo");
                return q;
              },
              { replace: true },
            )
          }
          onSent={(created) => {
            navigate("/comunicados", { replace: true, state: { sent: { status: created.status } } });
            reload();
          }}
        />
      )}
      {cancelling && <CancelAnnouncementDialog announcement={cancelling} onClose={() => setCancelling(null)} onDone={reload} />}
    </div>
  );
}

// RF-COM-01: lista de comunicados da gestão; a barreira de dados é o servidor (403 vira "sem permissão" na lista).
export function AnnouncementsPage() {
  return <Content />;
}
