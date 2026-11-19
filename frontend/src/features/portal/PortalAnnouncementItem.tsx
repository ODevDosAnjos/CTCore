import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { AnnouncementItem } from "./usePortalAnnouncements";

const short = (date: string) => formatDate(date).slice(0, 5);

// RF-POR-06: uma linha da lista única (canvas PortalAvisos / PortalMAvisos). O não lido tem ponto com texto acessível, não só cor; clicar abre o aviso e grava a leitura.
export function PortalAnnouncementItem({ item, onOpen }: { item: AnnouncementItem; onOpen: (id: string) => void }) {
  const { t } = useTranslation();
  const date = short(item.sentAt);
  const where = item.destination.kind === "CLASS" || item.destination.kind === "CLASSES" ? item.destination.names.join(", ") : item.unit;
  const support = [item.modality, where, item.author, item.summary].filter(Boolean).join(" · ");
  const mobile = `${item.modality ?? t("portalAnnouncements.allClasses")} · ${date}`;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className={`flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${item.unread ? "bg-danger/30" : ""}`}
      >
        <span className="mt-1.5 flex size-2 shrink-0 items-center justify-center">
          {item.unread && (
            <span className="size-2 rounded-full bg-danger-foreground">
              <span className="sr-only">{t("portalAnnouncements.unreadDot")}</span>
            </span>
          )}
        </span>
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`break-words ${item.unread ? "font-semibold" : "font-medium"}`}>{item.title}</span>
            {item.pinned && (
              <>
                <Badge tone="neutral" className="max-sm:hidden">
                  {item.pinnedUntil ? t("portalAnnouncements.pinnedUntil", { date: short(item.pinnedUntil) }) : t("portalAnnouncements.pinned")}
                </Badge>
                <Badge tone="neutral" className="sm:hidden">
                  {t("portalAnnouncements.pinned")}
                </Badge>
              </>
            )}
          </span>
          <span className="break-words text-sm text-muted-foreground max-sm:hidden">{support}</span>
          <span className="break-words text-sm text-muted-foreground sm:hidden">{mobile}</span>
        </span>
        <span className="shrink-0 text-sm text-muted-foreground max-sm:hidden">{date}</span>
      </button>
    </li>
  );
}
