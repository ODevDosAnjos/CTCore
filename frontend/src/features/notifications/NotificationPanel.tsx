import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useBelowSm } from "@/components/query/useBelowSm";
import { TONE_CLASS } from "@/components/ui/status-tone";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { NOTIFICATION_LOOK, notificationTarget, relativeTime } from "./notificationActions";
import { useNotificationPanel, type AppNotification } from "./useNotifications";

type Filter = "all" | "unread";

function Row({ n, onNavigate }: { n: AppNotification; onNavigate: () => void }) {
  const { t } = useTranslation();
  const unread = n.readAt === null;
  const rel = relativeTime(n.createdAt);
  const p = n.params;
  const { icon: Icon, tone } = NOTIFICATION_LOOK[n.type];
  const text = t(`notifications.types.${n.type}.text`, {
    studentName: String(p.studentName ?? ""),
    personName: String(p.personName ?? ""),
    amount: typeof p.amountCents === "number" ? formatCurrency(p.amountCents) : "",
  });
  return (
    <li className="border-t first:border-t-0">
      <Link
        to={notificationTarget(n)}
        onClick={onNavigate}
        className={cn("flex min-h-11 gap-3 px-4 py-3 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", unread && "bg-surface-soft")}
      >
        <span aria-hidden="true" className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", TONE_CLASS[tone])}>
          <Icon className="size-4" />
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className={cn("text-sm", unread ? "font-semibold" : "font-normal")}>{t(`notifications.types.${n.type}.title`)}</span>
          <span className="break-words text-[13px] text-muted-foreground">{text}</span>
          <time className="text-xs text-muted-foreground" dateTime={n.createdAt} title={formatDateTime(n.createdAt)}>
            {t(`notifications.time.${rel.key}`, { count: rel.count })}
          </time>
        </span>
        {unread && (
          <>
            <span aria-hidden="true" className="mt-1 size-2 shrink-0 rounded-full bg-brand" />
            <span className="sr-only">{t("notifications.unreadDot")}</span>
          </>
        )}
      </Link>
    </li>
  );
}

// RF-NOT-01: painel do sino. A barreira de permissão é do servidor (403 vira o estado sem permissão).
// Montado só com o popover aberto: abrir busca de novo.
export function NotificationPanel({ onClose, onBack, onUnread }: { onClose: () => void; onBack: () => void; onUnread: (count: number) => void }) {
  const { t } = useTranslation();
  const phone = useBelowSm();
  const panel = useNotificationPanel(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [failed, setFailed] = useState(false);
  const unreadCount = panel.data?.unreadCount;
  useEffect(() => {
    if (unreadCount !== undefined) onUnread(unreadCount);
  }, [unreadCount, onUnread]);

  const items = panel.data?.items ?? [];
  const unreadItems = items.filter((n) => n.readAt === null);
  const shown = filter === "unread" ? unreadItems : items;

  const markAll = () => panel.readAll().then(() => setFailed(false), () => setFailed(true));

  let body;
  if (panel.status === "loading") body = <LoadingState />;
  else if (panel.status === "forbidden") body = <ForbiddenState />;
  else if (panel.status === "error") body = <ErrorState onRetry={panel.retry} />;
  else if (items.length === 0) body = <EmptyState title={t("notifications.empty.title")} text={t("notifications.empty.text")} />;
  else if (shown.length === 0) body = <EmptyState title={t("notifications.allRead.title")} text={t("notifications.allRead.text")} />;
  else {
    body = (
      <div className="flex flex-col">
        {unreadItems.length === 0 && (
          <p role="status" className="px-4 pb-2 text-sm font-medium">
            {t("notifications.allRead.title")}
          </p>
        )}
        {(["TODAY", "WEEK"] as const).map((group) => {
          const rows = shown.filter((n) => n.group === group);
          if (rows.length === 0) return null;
          return (
            <section key={group} aria-labelledby={`notif-${group}`}>
              <h3 id={`notif-${group}`} className="bg-surface-soft px-4 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                {t(`notifications.groups.${group}`)}
              </h3>
              <ul>
                {rows.map((n) => (
                  <Row key={n.id} n={n} onNavigate={onClose} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    );
  }

  const ready = panel.status === "ready" && items.length > 0;
  const pill = (active: boolean) =>
    cn(
      "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium after:absolute after:left-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-surface-soft",
    );
  const markAllButton = (
    <Button variant="ghost" size="sm" disabled={unreadItems.length === 0} onClick={markAll}>
      {phone ? t("notifications.markAllShort") : t("notifications.markAll")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {phone && (
            <Button variant="ghost" size="icon" className="-ml-2 min-h-11 min-w-11" aria-label={t("notifications.back")} onClick={onBack}>
              <ArrowLeft aria-hidden="true" />
            </Button>
          )}
          <h2 className="font-heading text-xl font-semibold sm:uppercase">{t("notifications.title")}</h2>
        </div>
        {ready && !phone && markAllButton}
      </div>
      {ready && (
        <div className="flex items-center justify-between gap-2 px-4">
          <div role="group" aria-label={t("notifications.filters.label")} className="flex gap-2">
            <button type="button" className={pill(filter === "all")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
              {t("notifications.filters.all")}
            </button>
            <button type="button" className={pill(filter === "unread")} aria-pressed={filter === "unread"} onClick={() => setFilter("unread")}>
              {t("notifications.filters.unread")}
              {unreadItems.length > 0 && <span className="text-xs opacity-75">{unreadItems.length}</span>}
            </button>
          </div>
          {phone && markAllButton}
        </div>
      )}
      {failed && (
        <p role="alert" className="px-4 text-sm">
          {t("notifications.failed")}
        </p>
      )}
      {panel.status === "ready" ? body : <div className="px-4">{body}</div>}
      {panel.status === "ready" && <p className="px-4 text-center text-xs text-muted-foreground">{t("notifications.retention")}</p>}
    </div>
  );
}
