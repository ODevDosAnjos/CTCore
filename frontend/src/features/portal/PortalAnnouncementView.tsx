import { ArrowLeft, CalendarDays, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { openPortalAnnouncement, type AnnouncementDetail } from "./usePortalAnnouncements";

type Loaded = { id: string; detail?: AnnouncementDetail; failure?: "forbidden" | "notFound" | "error" };

// RF-POR-06, RN-COM-08: página própria do aviso (canvas PortalAvisoAberto / PortalMAvisoAberto). Abrir grava a leitura do aluno. Título e texto entram como texto, nunca como HTML.
export function PortalAnnouncementView({ id, studentId, onBack, onRead }: { id: string; studentId: string | null; onBack: () => void; onRead: () => void }) {
  const { t } = useTranslation();
  const [done, setDone] = useState<Loaded>();
  const [tick, setTick] = useState(0);
  const read = useRef(onRead);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    read.current = onRead;
  });

  useEffect(() => {
    let alive = true;
    openPortalAnnouncement(id, studentId).then(
      (detail) => {
        if (!alive) return;
        setDone({ id, detail });
        read.current();
      },
      (e) => alive && setDone({ id, failure: e instanceof ApiError && e.status === 403 ? "forbidden" : e instanceof ApiError && e.status === 404 ? "notFound" : "error" }),
    );
    return () => {
      alive = false;
    };
  }, [id, studentId, tick]);

  const current = done?.id === id ? done : undefined;
  const detail = current?.detail;
  useEffect(() => {
    if (detail) heading.current?.focus();
  }, [detail]);
  const retry = () => {
    setDone(undefined);
    setTick((n) => n + 1);
  };

  const where =
    detail &&
    [detail.modality, detail.destination.kind === "CLASS" || detail.destination.kind === "CLASSES" ? detail.destination.names.join(", ") : null, detail.unit]
      .filter(Boolean)
      .join(" · ");
  const group = detail?.groupLink && /^https?:\/\//i.test(detail.groupLink) ? detail.groupLink : null;
  const author = detail && (detail.authorRole ? `${detail.author}, ${t(`portalAnnouncements.role.${detail.authorRole}`)}` : detail.author);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          <span className="max-sm:hidden">{t("portalAnnouncements.back")}</span>
          <span className="sm:hidden">{t("portalAnnouncements.backShort")}</span>
        </Button>
      </div>
      {!current && <LoadingState />}
      {current?.failure === "forbidden" && <ForbiddenState />}
      {current?.failure === "notFound" && <EmptyState title={t("portalAnnouncements.notFoundTitle")} text={t("portalAnnouncements.notFoundText")} />}
      {current?.failure === "error" && <ErrorState onRetry={retry} />}
      {detail && (
        <>
        <article className="flex max-w-3xl flex-col gap-4 rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{t(`portalAnnouncements.type.${detail.type}`, { defaultValue: t("portalAnnouncements.type.GENERAL") })}</Badge>
              {where && <span className="break-words text-sm text-muted-foreground">{where}</span>}
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="max-sm:hidden">{t("portalAnnouncements.at", { date: formatDate(detail.sentAt, detail.timeZone), time: formatTime(detail.sentAt, detail.timeZone) })}</span>
              <span className="sm:hidden">{`${formatDate(detail.sentAt, detail.timeZone).slice(0, 5)} · ${formatTime(detail.sentAt, detail.timeZone)}`}</span>
            </p>
          </div>
          <h1 ref={heading} tabIndex={-1} className="break-words text-2xl font-semibold uppercase leading-tight focus-visible:outline-none sm:text-4xl">
            {detail.title}
          </h1>
          <div className="flex items-center gap-3">
            <Avatar name={detail.author} decorative />
            <span className="break-words text-sm font-medium">{author}</span>
          </div>
          {detail.imageUrl && <img src={detail.imageUrl} alt={t("portalAnnouncements.imageAlt")} className="max-h-64 w-full rounded-md object-contain" />}
          <p className="whitespace-pre-wrap break-words">{detail.body}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link to={`/portal/agenda${studentId ? `?aluno=${studentId}` : ""}`}>
                <CalendarDays aria-hidden="true" />
                {t("portalAnnouncements.viewAgenda")}
              </Link>
            </Button>
            {group && (
              <Button asChild variant="whatsapp">
                <a href={group} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  {t("portalAnnouncements.openGroup")}
                </a>
              </Button>
            )}
          </div>
        </article>
        </>
      )}
    </div>
  );
}
