import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { RelativeDate } from "@/components/RelativeDate";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar, Person } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { useQueryParams } from "@/components/query/useQueryParams";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PillFilter } from "@/components/ui/pill-filter";
import { SearchBox } from "@/components/ui/search-box";
import { formatCurrency } from "@/lib/format";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import { EditUnitsDialog } from "./EditUnitsDialog";
import { InviteUserDialog } from "./InviteUserDialog";
import { resendInvite, useUsers, type StaffUser } from "./useUsers";

const list = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

function Content() {
  const { t } = useTranslation();
  const api = useUsers();
  const narrow = useBelowSm();
  const { units } = useUnitScope();
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [deactivating, setDeactivating] = useState<StaffUser | null>(null);
  const [notice, setNotice] = useState<string>();
  // R7: busca e filtros no endereço, pelo roteador.
  const { get, set, clear } = useQueryParams();
  const q = get("q");
  const unit = get("unidade");
  const status = get("situacao");
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.users) return <ErrorState onRetry={api.retry} />;

  const users = api.users;
  const done = (key: string) => () => {
    setNotice(t(key));
    void api.refresh();
  };
  async function resend(u: StaffUser) {
    try {
      await resendInvite(u.linkId);
      setNotice(t("administrators.resendDone"));
    } catch {
      setNotice(t("administrators.resendError"));
    }
  }

  // D1: busca e filtros no cliente; a lista do servidor já vem inteira (até 200 vínculos).
  const needle = q.trim().toLowerCase();
  const shown = users.filter(
    (u) =>
      (status ? u.status === status : u.status !== "ENDED") &&
      (!unit || u.units.some((x) => x.id === unit)) &&
      (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)),
  );

  const sr = (u: StaffUser) => <span className="sr-only"> {u.name}</span>;
  const statusBadge = (u: StaffUser) =>
    u.status === "PENDING" ? <Badge tone="info">{t("administrators.statuses.PENDING")}</Badge> : <StatusBadge status={u.status} label={t(`administrators.statuses.${u.status}`)} />;
  // RN-ASS-21: o servidor diz quantas vagas a linha ocupa; aqui só se multiplica.
  const cost = (u: StaffUser) =>
    u.status === "PENDING" ? t("administrators.cost.pending") : u.seats === 0 ? t("administrators.cost.free") : t("administrators.cost.perMonth", { value: formatCurrency(u.seats * api.price) });
  const total = users.filter((u) => u.status === "ACTIVE").reduce((n, u) => n + u.seats, 0) * api.price;
  const unitNames = (u: StaffUser) => list.format(u.units.map((x) => x.name));
  const actions = (u: StaffUser) =>
    u.canManage && (
      <div className="flex flex-wrap gap-1">
        {u.status === "PENDING" && (
          <Button variant="ghost" size="sm" onClick={() => void resend(u)}>
            {t("administrators.resend")}
            {sr(u)}
          </Button>
        )}
        {(
          <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
            {t("administrators.editUnits.button")}
            {sr(u)}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setDeactivating(u)}>
          {t("administrators.deactivate.button")}
          {sr(u)}
        </Button>
      </div>
    );
  const columns: Column<StaffUser>[] = [
    { key: "name", label: t("administrators.person"), render: (u) => <Person size="sm" name={u.name} secondary={u.email} /> },
    { key: "units", label: t("administrators.units"), render: (u) => unitNames(u) },
    { key: "last", label: t("administrators.lastAccess"), render: (u) => <RelativeDate value={u.lastAccessAt} /> },
    { key: "status", label: t("administrators.status"), render: statusBadge },
    { key: "cost", label: t("administrators.cost.column"), render: cost },
    { key: "actions", label: t("administrators.actions"), hideLabel: true, render: actions },
  ];

  const invite = (
    <Button className="w-full max-sm:order-first sm:w-auto" onClick={() => setInviting(true)}>
      <Plus aria-hidden="true" />
      {t("administrators.invite.button")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("administrators.title")}
        className="max-sm:[&>div:last-child]:w-full"
        actions={
          <>
            {users.length > 0 && invite}
          </>
        }
      />
      <p className="text-sm text-muted-foreground">{t("administrators.total", { total: formatCurrency(total) })}</p>
      {notice && <Banner tone="ok">{notice}</Banner>}
      {users.length === 0 ? (
        <EmptyState title={t("administrators.emptyTitle")} text={t("administrators.emptyText")} action={<Button onClick={() => setInviting(true)}>{t("administrators.invite.button")}</Button>} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox className="w-full sm:w-[260px]" value={q} onChange={(v) => set({ q: v }, true)} placeholder={t("administrators.search")} />
                        <PillFilter label={t("administrators.filter.unit")} value={unit} onChange={(v) => set({ unidade: v })} allLabel={t("administrators.filter.allUnits")} options={units.map((u) => ({ id: u.id, name: u.name }))} />
            <PillFilter label={t("administrators.filter.status")} value={status} onChange={(v) => set({ situacao: v })} allLabel={t("administrators.filter.allStatuses")} options={["ACTIVE", "PENDING"].map((id) => ({ id, name: t(`administrators.filters.${id}`) }))} />
          </div>
          {shown.length === 0 ? (
            <EmptyState
              title={t("administrators.noMatchTitle")}
              text={t("administrators.noMatchText")}
              action={
                <Button variant="secondary" onClick={clear}>
                  {t("administrators.clearFilters")}
                </Button>
              }
            />
          ) : narrow ? (
            <ul className="flex flex-col divide-y rounded-card border bg-card px-4">
              {shown.map((u) => (
                <li key={u.linkId} className="py-3">
                  <RowCard
                    lead={<Avatar name={u.name} decorative size="sm" />}
                    title={u.name}
                    meta={
                      <>
                        <span className="break-all">{u.email}</span>
                        <span>
                          {unitNames(u)} · <RelativeDate value={u.lastAccessAt} />
                        </span>
                        <span>
                          {cost(u)}
                        </span>
                        {actions(u)}
                      </>
                    }
                    badge={statusBadge(u)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="overflow-hidden rounded-card border bg-card [&_th]:normal-case">
              <DataTable columns={columns} rows={shown} rowKey={(u) => u.linkId} order="" onOrder={() => undefined} />
            </div>
          )}
        </>
      )}
      <InviteUserDialog open={inviting} price={api.price} onClose={() => setInviting(false)} onDone={done("administrators.invite.done")} />
      <EditUnitsDialog user={editing} price={api.price} onClose={() => setEditing(null)} onDone={done("administrators.editUnits.done")} />
      <DeactivateUserDialog user={deactivating} onClose={() => setDeactivating(null)} onDone={done("administrators.deactivate.done")} />
    </div>
  );
}

// RF-ACE-06: só o Coordenador; a barreira é o servidor (403 vira "sem permissão").
export function AdministratorsPage() {
  return <Content />;
}
