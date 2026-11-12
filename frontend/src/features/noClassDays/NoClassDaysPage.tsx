import { useState } from "react";
import { Link } from "react-router";
import { Undo2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBelowSm } from "@/components/query/useBelowSm";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { br, brShort, toIso, weekday } from "@/features/agenda/agendaDates";
import { useSession } from "@/features/auth/SessionProvider";
import { ManagementLayout } from "@/features/permissions/ManagementLayout";
import { usePermissions } from "@/features/permissions/usePermissions";
import { NoClassDayDialog } from "./NoClassDayDialog";
import { UndoNoClassDayDialog } from "./UndoNoClassDayDialog";
import { ignoreHoliday, useNoClassDays, type NoClassDayItem, type Suggestion } from "./useNoClassDays";

type Dialog = { kind: "new"; suggestion?: Suggestion } | { kind: "edit"; item: NoClassDayItem } | { kind: "undo"; item: NoClassDayItem };

const sectionTitle = "font-heading text-lg font-semibold uppercase tracking-wide";
const th = "px-3 py-2 text-left";
const td = "px-3 py-2 align-middle";

function Content() {
  const { t } = useTranslation();
  const { state } = useSession();
  const { permissions } = usePermissions();
  const narrow = useBelowSm();
  const [unitId, setUnitId] = useState("");
  const [dialog, setDialog] = useState<Dialog>();
  const [feedback, setFeedback] = useState<{ tone: "ok" | "danger"; text: string }>();
  const { status, data, last, retry } = useNoClassDays(unitId);
  const options = data ?? last;
  const role = state.status === "ready" ? state.session.links.find((l) => l.id === state.session.activeLinkId)?.role : undefined;
  const canNotify = !!permissions && permissions.ANNOUNCEMENTS !== "NONE";
  const canManage = !!permissions && permissions.NO_CLASS_DAYS !== "NONE" && !!options?.unit;
  const period = (d: NoClassDayItem) => (d.startsOn === d.endsOn ? t("noClassDays.list.single", { date: br(d.startsOn) }) : t("noClassDays.list.period", { from: br(d.startsOn), to: br(d.endsOn) }));
  const shortPeriod = (d: NoClassDayItem) => (d.startsOn === d.endsOn ? brShort(d.startsOn) : t("noClassDays.list.period", { from: brShort(d.startsOn), to: brShort(d.endsOn) }));
  const holidayName = (s: Suggestion) => t(`noClassDays.holidays.${s.code}`);
  const affected = (n: number) => t("noClassDays.suggestions.affected", { count: n });
  const origin = (d: NoClassDayItem) => (d.origin === "COORDINATOR" && d.unitsInBatch > 1 ? t("noClassDays.origins.COORDINATOR_BATCH", { count: d.unitsInBatch }) : t(`noClassDays.origins.${d.origin}`));
  const sentDate = (iso: string | null) => (iso ? brShort(toIso(new Date(iso))) : "");
  const noticeText = (d: NoClassDayItem) => t(`noClassDays.noticeStatus.${d.notice.status}`, { date: sentDate(d.notice.sendAt) });
  const noticeTone = (d: NoClassDayItem) => (d.notice.status === "SENT" ? "ok" : d.notice.status === "SCHEDULED" ? "info" : "warn");
  const noticeLine = (d: NoClassDayItem) =>
    d.notice.status === "SENT" ? t("noClassDays.list.noticeSent", { date: sentDate(d.notice.sentAt) }) : noticeText(d);
  const dayOf = (s: Suggestion) => data?.days.find((d) => d.id === s.dayId);

  async function ignore(s: Suggestion) {
    if (!options?.unit) return;
    try {
      await ignoreHoliday(unitId || options.unit.id, s.date);
      setFeedback({ tone: "ok", text: t("noClassDays.ignoredDone") });
      retry();
    } catch {
      setFeedback({ tone: "danger", text: t("noClassDays.ignoreFailed") });
    }
  }

  // Ações da linha (R4): "Avisar" só sem aviso e com permissão de comunicar; "Editar" e o ícone de desfazer só em dia editável.
  const actions = (d: NoClassDayItem) => (
    <>
      {canNotify && d.notice.status === "NOT_NOTIFIED" && (
        <Button variant="secondary" className="min-h-11" asChild>
          <Link aria-label={t("noClassDays.list.notifyLabel", { reason: d.reason })} to={`/comunicados/novo?${new URLSearchParams({ type: "NO_CLASS_DAY", unitId: d.unit.id, startsOn: d.startsOn, endsOn: d.endsOn, reason: d.reason, noClassDayId: d.id })}`}>
            {t("noClassDays.list.notify")}
          </Link>
        </Button>
      )}
      {canManage && d.canEdit && (
        <>
          <Button variant="secondary" className="min-h-11" aria-label={t("noClassDays.list.editLabel", { reason: d.reason })} onClick={() => setDialog({ kind: "edit", item: d })}>
            {t("noClassDays.list.edit")}
          </Button>
          <Button variant="ghost" size="icon" className="min-h-11" aria-label={t("noClassDays.list.undoLabel", { reason: d.reason })} onClick={() => setDialog({ kind: "undo", item: d })}>
            <Undo2 aria-hidden="true" />
          </Button>
        </>
      )}
  </>
  );
  const newButton = canManage && (
    <Button className={narrow ? "w-full min-h-11" : "min-h-11"} onClick={() => setDialog({ kind: "new" })}>
      {t("noClassDays.new")}
    </Button>
  );

  if (status === "forbidden") {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title={t("noClassDays.title")} />
        <ForbiddenState />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("noClassDays.title")}
        subtitle={options?.unit ? t("noClassDays.subtitle", { unit: options.unit.name }) : undefined}
        actions={!narrow && newButton}
      />
      {options && options.units.length > 1 && (
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          {t("noClassDays.unit")}
          <Select className="min-h-11" value={unitId || options.unit?.id || ""} onChange={(e) => setUnitId(e.target.value)}>
            {options.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      {feedback && <Banner tone={feedback.tone}>{feedback.text}</Banner>}
      {status === "loading" && <LoadingState />}
      {status === "error" && <ErrorState onRetry={retry} />}
      {status === "ready" && data && (
        <>
          {canManage && data.suggestions.length > 0 && (
            <section aria-labelledby="suggestions-title" className="flex flex-col gap-2">
              <h2 id="suggestions-title" className={sectionTitle}>
                {narrow ? t("noClassDays.suggestions.titleMobile") : t("noClassDays.suggestions.title")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("noClassDays.suggestions.note")}</p>
              {narrow ? (
                <ul className="flex flex-col gap-2">
                  {data.suggestions.map((s) => {
                    const done = dayOf(s);
                    return (
                      <li key={s.date} className="flex flex-col gap-2 rounded-card border bg-card p-3">
                        <div className="min-w-0">
                          <p className="break-words font-medium">
                            {brShort(s.date)} · {holidayName(s)}
                          </p>
                          <p className="text-xs text-muted-foreground">{t("noClassDays.suggestions.systemSuggestion")}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.dayId ? (
                            <>
                              <Badge tone="ok">{t("noClassDays.suggestions.confirmed")}</Badge>
                              {done && canManage && done.canEdit && (
                                <Button variant="secondary" className="min-h-11" onClick={() => setDialog({ kind: "undo", item: done })}>
                                  {t("noClassDays.suggestions.undo")}
                                </Button>
                              )}
                            </>
                          ) : (
                            <>
                              <Button className="min-h-11" aria-label={t("noClassDays.suggestions.confirmLabel", { name: holidayName(s), date: br(s.date) })} onClick={() => setDialog({ kind: "new", suggestion: s })}>
                                {t("noClassDays.suggestions.confirm")}
                              </Button>
                              <Button variant="secondary" className="min-h-11" aria-label={t("noClassDays.suggestions.ignoreLabel", { name: holidayName(s), date: br(s.date) })} onClick={() => void ignore(s)}>
                                {t("noClassDays.suggestions.ignore")}
                              </Button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="overflow-x-auto rounded-card border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
                      <tr>
                        <th scope="col" className={th}>{t("noClassDays.suggestions.date")}</th>
                        <th scope="col" className={th}>{t("noClassDays.suggestions.holiday")}</th>
                        <th scope="col" className={th}>{t("noClassDays.suggestions.affected")}</th>
                        <th scope="col" className={th}>
                          <span className="sr-only">{t("noClassDays.suggestions.actions")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.suggestions.map((s) => {
                        const done = dayOf(s);
                        return (
                          <tr key={s.date} className="border-t border-divider">
                            <td className={td}>
                              {br(s.date)} · {t(`noClassDays.weekdays.${weekday(s.date)}`)}
                            </td>
                            <td className={td}>{holidayName(s)}</td>
                            <td className={td}>{affected(s.affectedLessons)}</td>
                            <td className={`${td} text-right`}>
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                {s.dayId ? (
                                  <>
                                    <Badge tone="ok">{t("noClassDays.suggestions.confirmed")}</Badge>
                                    {done && done.canEdit && (
                                      <Button variant="secondary" className="min-h-11" aria-label={t("noClassDays.suggestions.undoLabel", { name: holidayName(s), date: br(s.date) })} onClick={() => setDialog({ kind: "undo", item: done })}>
                                        {t("noClassDays.suggestions.undo")}
                                      </Button>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Button className="min-h-11" aria-label={t("noClassDays.suggestions.confirmLabel", { name: holidayName(s), date: br(s.date) })} onClick={() => setDialog({ kind: "new", suggestion: s })}>
                                      {t("noClassDays.suggestions.confirm")}
                                    </Button>
                                    <Button variant="secondary" className="min-h-11" aria-label={t("noClassDays.suggestions.ignoreLabel", { name: holidayName(s), date: br(s.date) })} onClick={() => void ignore(s)}>
                                      {t("noClassDays.suggestions.ignore")}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {data.days.length === 0 ? (
            <EmptyState title={t("noClassDays.emptyTitle")} text={t("noClassDays.emptyText")} />
          ) : (
            <section aria-labelledby="days-title" className="flex flex-col gap-2">
              <h2 id="days-title" className={sectionTitle}>
                {t("noClassDays.list.title")}
              </h2>
              {narrow ? (
                <ul className="flex flex-col gap-2">
                  {data.days.map((d) => (
                    <li key={d.id} className="flex flex-col gap-2 rounded-card border bg-card p-3">
                      <div className="min-w-0">
                        <p className="break-words font-medium">
                          {shortPeriod(d)} · {d.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("noClassDays.list.cancelled", { count: d.cancelledLessons })} · {noticeLine(d)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {actions(d)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="overflow-x-auto rounded-card border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-soft text-xs uppercase text-muted-foreground">
                      <tr>
                        <th scope="col" className={th}>{t("noClassDays.list.date")}</th>
                        <th scope="col" className={th}>{t("noClassDays.list.reason")}</th>
                        <th scope="col" className={th}>{t("noClassDays.list.classes")}</th>
                        <th scope="col" className={th}>{t("noClassDays.list.origin")}</th>
                        <th scope="col" className={th}>{t("noClassDays.list.notice")}</th>
                        <th scope="col" className={th}>
                          <span className="sr-only">{t("noClassDays.list.actions")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.days.map((d) => (
                        <tr key={d.id} className="border-t border-divider">
                          <td className={`${td} whitespace-nowrap`}>{period(d)}</td>
                          <td className={`${td} break-words`}>{d.reason}</td>
                          <td className={`${td} break-words`}>{d.allClasses ? t("noClassDays.list.allClasses") : d.classes.map((c) => c.name).join(", ")}</td>
                          <td className={td}>{origin(d)}</td>
                          <td className={td}>
                            <Badge tone={noticeTone(d)}>{noticeText(d)}</Badge>
                          </td>
                          <td className={`${td} text-right`}>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {actions(d)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {narrow && newButton}
        </>
      )}
      {dialog && options?.unit && dialog.kind !== "undo" && (
        <NoClassDayDialog
          key={dialog.kind === "edit" ? dialog.item.id : (dialog.suggestion?.date ?? "new")}
          units={options.units}
          unit={options.unit}
          multi={role === "COORDINATOR"}
          item={dialog.kind === "edit" ? dialog.item : undefined}
          suggestion={dialog.kind === "new" ? dialog.suggestion : undefined}
          onClose={() => setDialog(undefined)}
          onSaved={retry}
        />
      )}
      {dialog?.kind === "undo" && <UndoNoClassDayDialog item={dialog.item} period={period(dialog.item)} onClose={() => setDialog(undefined)} onDone={retry} />}
    </div>
  );
}

// RF-AGE-05: a barreira de dados é o servidor (403 vira "sem permissão" na própria tela).
export function NoClassDaysPage() {
  return (
    <ManagementLayout activeId="noClassDays">
      <Content />
    </ManagementLayout>
  );
}
