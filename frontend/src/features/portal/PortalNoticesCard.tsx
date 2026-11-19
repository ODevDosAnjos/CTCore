import { ChevronRight, Pin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/states";
import { formatDate } from "@/lib/format";
import { PortalTag } from "./PortalTag";
import type { PortalHomeData } from "./usePortalHome";

// RF-POR-02, RN-COM-08: avisos não lidos e fixados; ler e marcar como lido é da aba Avisos (#93), para onde o link leva.
export function PortalNoticesCard({ data }: { data: PortalHomeData["announcements"] }) {
  const { t } = useTranslation();
  return (
    <Card
      heading="h2" titleClassName="text-2xl uppercase"
      title={t("portalHome.notices.title")}
      actions={
        <Link to="/portal/avisos" className="inline-flex min-h-11 items-center text-sm underline">
          {t("portalHome.notices.viewAll")}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      }
    >
      {data.items.length === 0 ? (
        <EmptyState title={t("portalHome.notices.emptyTitle")} text={t("portalHome.notices.emptyText")} />
      ) : (
        <ul className="flex flex-col divide-y">
          {data.items.map((n) => (
            <li key={n.id} className="flex items-center gap-3 py-3">
              <span className="flex size-2 shrink-0">
                {n.unread && (
                  <>
                    <span aria-hidden="true" className="size-2 rounded-full bg-danger-foreground" />
                    <span className="sr-only">{t("portalHome.notices.unread")}</span>
                  </>
                )}
              </span>
              <p className="min-w-0 flex-1 break-words font-medium">{n.title}</p>
              {n.pinned && (
                <PortalTag tone="strong">
                  <Pin aria-hidden="true" className="mr-1 size-3.5 self-center" />
                  {t("portalHome.notices.pinned")}
                </PortalTag>
              )}
              <span className="shrink-0 text-sm text-muted-foreground">{formatDate(n.sentAt).slice(0, 5)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
