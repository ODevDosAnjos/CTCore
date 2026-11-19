import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/states";
import { relativeDay } from "@/lib/format";
import { PortalTag } from "./PortalTag";
import type { HomeLesson } from "./usePortalHome";

// "19:30" vira "19h30" e "07:00" vira "7h".
const hour = (time: string) => {
  const [h, m] = time.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
};
const weekday = (date: string) => {
  const w = new Date(`${date}T00:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", "");
  return w.charAt(0).toUpperCase() + w.slice(1);
};

// Dia e hora curtos: "Hoje 19h30", "Sex 7h" e, depois de 6 dias, "Seg 12/10".
function useShortWhen() {
  const { t } = useTranslation();
  return (l: HomeLesson) => {
    const ahead = -(relativeDay(l.date) ?? 0);
    if (ahead > 6) return `${weekday(l.date)} ${l.date.slice(8)}/${l.date.slice(5, 7)}`;
    if (ahead <= 0) return `${t("portalHome.lessons.today")} ${hour(l.startsAt)}`;
    return `${weekday(l.date)} ${hour(l.startsAt)}`;
  };
}

// RF-POR-02, RN-AGE-01: próximas aulas, com a cancelada e a alterada em destaque (o resumo da alteração é da Agenda).
export function PortalNextLessons({ items }: { items: HomeLesson[] }) {
  const { t } = useTranslation();
  const when = useShortWhen();
  return (
    <Card
      heading="h2" titleClassName="text-2xl uppercase"
      title={t("portalHome.lessons.title")}
      actions={
        <Link to="/portal/agenda" className="inline-flex min-h-11 items-center text-sm underline">
          {t("portalHome.lessons.viewAgenda")}
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState title={t("portalHome.lessons.emptyTitle")} text={t("portalHome.lessons.emptyText")} />
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((l) => {
            const cancelled = l.status === "CANCELLED";
            return (
              <li key={l.id} className="flex items-start gap-3 py-3">
                <span className="w-20 shrink-0 font-heading text-xl font-semibold">{cancelled ? t("portalHome.lessons.noLesson") : when(l)}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className={`break-words font-medium ${cancelled ? "line-through" : ""}`}>{l.title}</p>
                  <p className="break-words text-sm text-muted-foreground">
                    {l.unit.name} · {l.modality.name}
                  </p>
                  {cancelled && l.cancelReason && <p className="break-words text-sm">{t("portalHome.lessons.reason", { reason: l.cancelReason })}</p>}
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {l.changed && !cancelled && <PortalTag tone="strong">{t("portalHome.lessons.changed")}</PortalTag>}
                  {l.adhoc && <PortalTag>{t("portalHome.lessons.adhoc")}</PortalTag>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
