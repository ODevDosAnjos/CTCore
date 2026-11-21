import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Plus, ShieldCheck } from "lucide-react";
import { DataTable, type Column } from "@/components/query/DataTable";
import { RowCard } from "@/components/query/RowCard";
import { useBelowSm } from "@/components/query/useBelowSm";
import { RelativeDate } from "@/components/RelativeDate";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar, Person } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { PillFilter } from "@/components/ui/pill-filter";
import { SearchBox } from "@/components/ui/search-box";
import type { Tone } from "@/components/ui/status-tone";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import { EditUnitsDialog } from "./EditUnitsDialog";
import { InviteUserDialog } from "./InviteUserDialog";
import { resendInvite, useUsers, type StaffUser } from "./useUsers";

const ROLE_TONE: Record<string, { tone: Tone; className?: string }> = {
  COORDINATOR: { tone: "neutral", className: "bg-primary text-primary-foreground" },
  ADMINISTRATOR: { tone: "info" },
  TEACHER: { tone: "neutral" },
};
const PROFILES = ["COORDINATOR", "ADMINISTRATOR", "TEACHER"] as const;
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
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [unit, setUnit] = useState("");
  const [status, setStatus] = useState("");
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
      setNotice(t("users.resendDone"));
    } catch {
      setNotice(t("users.resendError"));
    }
  }
  const clear = () => {
    setQ("");
    setRole("");
    setUnit("");
    setStatus("");
  };

  // D1: busca e filtros no cliente; a lista do servidor já vem inteira (até 200 vínculos).
  const needle = q.trim().toLowerCase();
  const shown = users.filter(
    (u) =>
      (status ? u.status === status : u.status !== "ENDED") &&
      (!role || u.role === role) &&
      (!unit || u.units.some((x) => x.id === unit)) &&
      (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)),
  );

  const sr = (u: StaffUser) => <span className="sr-only"> {u.name}</span>;
  const roleBadge = (r: string) => (
    <Badge tone={ROLE_TONE[r].tone} className={ROLE_TONE[r].className}>
      {t(`layout.roles.${r}`)}
    </Badge>
  );
  const statusBadge = (u: StaffUser) =>
    u.status === "PENDING" ? <Badge tone="info">{t("users.statuses.PENDING")}</Badge> : <StatusBadge status={u.status} label={t(`users.statuses.${u.status}`)} />;
  const unitNames = (u: StaffUser) => list.format(u.units.map((x) => x.name));
  const actions = (u: StaffUser) =>
    u.canManage && (
      <div className="flex flex-wrap gap-1">
        {u.status === "PENDING" && (
          <Button variant="ghost" size="sm" onClick={() => void resend(u)}>
            {t("users.resend")}
            {sr(u)}
          </Button>
        )}
        {(u.status !== "PENDING" || u.role === "TEACHER") && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
            {t("users.editUnits.button")}
            {sr(u)}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setDeactivating(u)}>
          {t("users.deactivate.button")}
          {sr(u)}
        </Button>
      </div>
    );
  const columns: Column<StaffUser>[] = [
    { key: "name", label: t("users.person"), render: (u) => <Person size="sm" name={u.name} secondary={u.email} /> },
    { key: "role", label: t("users.role"), render: (u) => roleBadge(u.role) },
    { key: "units", label: t("users.units"), render: (u) => unitNames(u) },
    { key: "last", label: t("users.lastAccess"), render: (u) => <RelativeDate value={u.lastAccessAt} /> },
    { key: "status", label: t("users.status"), render: statusBadge },
    { key: "actions", label: t("users.actions"), hideLabel: true, render: actions },
  ];

  const invite = (
    <Button className="w-full max-sm:order-first sm:w-auto" onClick={() => setInviting(true)}>
      <Plus aria-hidden="true" />
      {t("users.invite.button")}
    </Button>
  );
  const tableLink = (
    <Button asChild variant="secondary" className="w-full sm:w-auto">
      <Link to="/configuracoes/usuarios/permissoes">
        <ShieldCheck aria-hidden="true" />
        {t("users.permissionsTable")}
      </Link>
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        className="max-sm:[&>div:last-child]:w-full"
        actions={
          <>
            {tableLink}
            {users.length > 0 && invite}
          </>
        }
      />
      {notice && <Banner tone="ok">{notice}</Banner>}
      <div className="hidden gap-3 sm:grid sm:grid-cols-3">
        {PROFILES.map((p) => (
          <section key={p} className="flex min-w-0 flex-col gap-2 rounded-card border bg-card p-4">
            <div className="flex items-center gap-3">
              {roleBadge(p)}
              <span className="text-[13px] text-muted-foreground">{t(`users.profiles.${p}.scope`)}</span>
            </div>
            <p className="text-[13px] leading-normal">{t(`users.profiles.${p}.text`)}</p>
          </section>
        ))}
      </div>
      {users.length === 0 ? (
        <EmptyState title={t("users.emptyTitle")} text={t("users.emptyText")} action={<Button onClick={() => setInviting(true)}>{t("users.invite.button")}</Button>} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox className="w-full sm:w-[260px]" value={q} onChange={setQ} placeholder={t("users.search")} />
            <PillFilter label={t("users.filter.role")} value={role} onChange={setRole} allLabel={t("users.filter.allRoles")} options={["ADMINISTRATOR", "TEACHER"].map((id) => ({ id, name: t(`users.roles.${id}`) }))} />
            <PillFilter label={t("users.filter.unit")} value={unit} onChange={setUnit} allLabel={t("users.filter.allUnits")} options={units.map((u) => ({ id: u.id, name: u.name }))} />
            <PillFilter label={t("users.filter.status")} value={status} onChange={setStatus} allLabel={t("users.filter.allStatuses")} options={["ACTIVE", "PENDING"].map((id) => ({ id, name: t(`users.filters.${id}`) }))} />
          </div>
          {shown.length === 0 ? (
            <EmptyState
              title={t("users.noMatchTitle")}
              text={t("users.noMatchText")}
              action={
                <Button variant="secondary" onClick={clear}>
                  {t("users.clearFilters")}
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
                          {t(`users.roles.${u.role}`)} · {unitNames(u)} · <RelativeDate value={u.lastAccessAt} />
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
      <InviteUserDialog open={inviting} onClose={() => setInviting(false)} onDone={done("users.invite.done")} />
      <EditUnitsDialog user={editing} onClose={() => setEditing(null)} onDone={done("users.editUnits.done")} />
      <DeactivateUserDialog user={deactivating} onClose={() => setDeactivating(null)} onDone={done("users.deactivate.done")} />
    </div>
  );
}

// RF-ACE-06: a rota já nega Professor; a barreira de dados é o servidor.
export function UsersPage() {
  return <Content />;
}
