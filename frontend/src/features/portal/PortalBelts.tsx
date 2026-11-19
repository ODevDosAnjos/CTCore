import { IdCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/states";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { ModalityDot } from "@/components/ui/modality-dot";
import { formatDate } from "@/lib/format";
import { PortalTag } from "./PortalTag";
import type { HomeBelt } from "./usePortalHome";

// RF-POR-02, RN-GRA-04: a faixa atual por modalidade, "Nova" nos 14 dias seguintes ao registro. Sem progresso de graduação (RN-POR-09).
export function PortalBelts({ items, studentId }: { items: HomeBelt[]; studentId: string | null }) {
  const { t } = useTranslation();
  return (
    <Card heading="h2" title={t("portalHome.belts.title")}>
      {items.length === 0 ? (
        <EmptyState title={t("portalHome.belts.emptyTitle")} text={t("portalHome.belts.emptyText")} />
      ) : (
        <ul className="flex flex-col divide-y">
          {items.map((b) => (
            <li key={b.modality.id} className="flex flex-col gap-1 py-3">
              <div className="flex items-center justify-between gap-2">
                <ModalityDot name={b.modality.name} className="text-sm font-medium" />
                {b.isNew && <PortalTag tone="strong">{t("portalHome.belts.new")}</PortalTag>}
              </div>
              <GraduationBelt name={b.levelName} color={b.color} secondaryColor={b.secondaryColor} degree={b.degree} label={t("portalHome.belts.grade", { level: b.levelName.toLowerCase(), count: b.degree })} />
              {b.achievedOn && <p className="text-sm text-muted-foreground">{t("portalHome.belts.since", { date: formatDate(b.achievedOn) })}</p>}
            </li>
          ))}
        </ul>
      )}
      <Link to={`/portal/carteirinha${studentId ? `?aluno=${studentId}` : ""}`} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm underline">
        <IdCard aria-hidden="true" className="size-4" />
        {t("portalCard.link")}
      </Link>
    </Card>
  );
}
