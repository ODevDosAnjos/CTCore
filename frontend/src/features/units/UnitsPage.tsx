import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { ComingSoon } from "@/components/ui/coming-soon";
import { PageHeader } from "@/components/ui/page-header";
import { useSession } from "@/features/auth/SessionProvider";
import { formatDate } from "@/lib/format";
import { hrefOf } from "@/routes";
import { DeactivateUnitDialog } from "./DeactivateUnitDialog";
import { MAX_UNITS, useUnits, type UnitSummary } from "./useUnits";

const HEAD = "px-4 py-3 font-medium text-muted-foreground";
const CELL = "px-4 py-3 align-middle";

function Content() {
  const { t } = useTranslation();
  const api = useUnits();
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  // RF-ORG-02: criar e desativar são só do Coordenador (a barreira é o servidor).
  const coordinator = session?.links.find((l) => l.id === session.activeLinkId)?.role === "COORDINATOR";
  const [deactivating, setDeactivating] = useState<UnitSummary | null>(null);
  const [notice, setNotice] = useState(false);
  const created = (useLocation().state as { created?: string } | null)?.created;
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.units) return <ErrorState onRetry={api.retry} />;

  const units = api.units;
  // Item 746 (D6): o Administrador de uma unidade só, e ativa, vai direto a ela, sem a lista no histórico.
  if (!coordinator && units.length === 1 && units[0].active) return <Navigate to={hrefOf("unitSettings", { id: units[0].id })} replace />;
  const active = units.filter((u) => u.active);
  const sr = (u: UnitSummary) => <span className="sr-only"> {u.name}</span>;
  const full = coordinator && units.length >= MAX_UNITS;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("units.title")}
        actions={
          !coordinator ? undefined : full ? (
            <Button disabled aria-describedby="units-limit">
              <Plus aria-hidden />
              {t("units.newButton")}
            </Button>
          ) : (
            <Button asChild>
              <Link to="/configuracoes/unidades/nova">
                <Plus aria-hidden />
                {t("units.newButton")}
              </Link>
            </Button>
          )
        }
      />
      {full && (
        <p id="units-limit" className="text-sm text-muted-foreground">
          {t("units.limitReached")}
        </p>
      )}
      {created && <Banner tone="ok">{t("units.new.created", { name: created })}</Banner>}
      {notice && <Banner tone="ok">{t("units.deactivate.done")}</Banner>}
      {units.length === 0 ? (
        <EmptyState title={t("units.emptyTitle")} text={t("units.emptyText")} />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="relative overflow-x-auto">
              <table aria-label={t("units.tableLabel")} className="w-full text-left text-sm">
                <thead className="border-b border-divider bg-surface-soft">
                  <tr>
                    <th scope="col" className={HEAD}>
                      {t("units.unit")}
                    </th>
                    <th scope="col" className={HEAD}>
                      {t("units.city")}
                    </th>
                    <th scope="col" className={`${HEAD} text-right`}>
                      {t("units.activeStudents")}
                    </th>
                    <th scope="col" className={HEAD}>
                      {t("units.administrators")}
                    </th>
                    <th scope="col" className={HEAD}>
                      {t("units.status")}
                    </th>
                    <th scope="col" className={HEAD}>
                      {t("units.shortName")}
                    </th>
                    <th scope="col" className={HEAD}>
                      <span className="sr-only">{t("units.actions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u) => (
                    <tr key={u.id} className="border-b border-divider last:border-b-0">
                      <td className={`${CELL} font-medium`}>{u.name}</td>
                      <td className={CELL}>{u.city ?? t("units.noCity")}</td>
                      <td className={`${CELL} text-right tabular-nums`}>{u.activeStudents}</td>
                      <td className={CELL}>{u.administrators.length ? u.administrators.map((a) => a.name).join(", ") : t("units.noAdministrators")}</td>
                      <td className={CELL}>
                        <StatusBadge
                          status={u.active ? "ACTIVE" : "INACTIVE"}
                          label={
                            u.active
                              ? t("units.active")
                              : u.deactivatedAt
                                ? t("units.inactiveOn", {
                                    date: formatDate(u.deactivatedAt),
                                  })
                                : t("units.inactive")
                          }
                        />
                      </td>
                      <td className={`${CELL} font-mono text-xs`}>{u.shortName}</td>
                      <td className={`${CELL} text-right`}>
                        {u.active ? (
                          <Button asChild variant="secondary" size="sm">
                            <Link to={hrefOf("unitSettings", { id: u.id })}>
                              {t("units.open")}
                              {sr(u)}
                            </Link>
                          </Button>
                        ) : (
                          <ComingSoon variant="button" label={t("units.history")} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {coordinator && (
            <div className="flex flex-wrap gap-2">
              {active.map((u) => (
                <Button key={u.id} variant="danger" size="sm" onClick={() => setDeactivating(u)}>
                  {t("units.deactivate.button", { name: u.name })}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
      <DeactivateUnitDialog
        unit={deactivating}
        onlyActive={active.length === 1}
        onClose={() => setDeactivating(null)}
        onDone={() => {
          setNotice(true);
          void api.refresh();
        }}
      />
    </div>
  );
}

// RF-ORG-02: Coordenador vê todas; Administrador, só as dele (a rota já nega os demais; a barreira de dados é o servidor).
export function UnitsPage() {
  return <Content />;
}
