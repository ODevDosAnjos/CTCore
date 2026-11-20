import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GraduationBelt } from "@/components/ui/graduation-belt";
import { ModalityDot } from "@/components/ui/modality-dot";
import { formatDate } from "@/lib/format";
import { OrgMark } from "./OrgMark";
import type { PortalCardData } from "./usePortalCard";

// RF-POR-03, RNF-22: cartão escuro do canvas; a faixa usa a identidade do ctcore, não a cor da organização (decisão 20). Sem QR code.
export function PortalMemberCard({ data, compact = false }: { data: PortalCardData; compact?: boolean }) {
  const { t } = useTranslation();
  const [photoBroken, setPhotoBroken] = useState(false);
  const { organization: org, student } = data;
  const units = [...new Set(data.modalities.map((m) => m.unit.name))].join(", ");
  const since = data.memberSince ? t("portalCard.since", { date: `${data.memberSince.slice(5, 7)}/${data.memberSince.slice(0, 4)}` }) : "";
  return (
    <article aria-label={t("portalCard.cardLabel", { name: student.name })} className="overflow-hidden rounded-2xl bg-sidebar text-sidebar-foreground shadow-menu">
      <div className="flex min-h-12 items-center gap-3 bg-brand px-5 py-3 text-brand-foreground">
        <OrgMark name={org.name} logoUrl={org.logoUrl} className="bg-brand-foreground/20 text-brand-foreground" />
        <p className="min-w-0 flex-1 break-words font-heading text-xl font-semibold uppercase">{org.name}</p>
        <Badge tone={data.status === "ACTIVE" ? "ok" : "neutral"}>{t(`portalCard.status.${data.status}`)}</Badge>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          {student.photoUrl && !photoBroken ? (
            <img src={student.photoUrl} alt="" className="size-[72px] shrink-0 rounded-full object-cover" onError={() => setPhotoBroken(true)} />
          ) : (
            <Avatar name={student.name} decorative className="size-[72px] text-2xl" />
          )}
          <div className="min-w-0">
            <h2 className="break-words font-heading text-2xl font-semibold uppercase leading-none text-brand-foreground sm:text-3xl">{student.name}</h2>
            <p className="mt-1 text-sm text-sidebar-foreground/70">{[since, units].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        {data.modalities.length === 0 ? (
          <div>
            <p className="font-medium">{t("portalCard.emptyTitle")}</p>
            <p className="text-sidebar-foreground/70">{t("portalCard.emptyText")}</p>
          </div>
        ) : (
          <ul aria-label={t("portalCard.modalitiesTitle")} className="flex flex-col gap-2 text-sm">
            {data.modalities.map((m) => (
              <li key={`${m.modality.id}|${m.unit.id}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <ModalityDot name={m.modality.name} />
                {m.belt ? (
                  <GraduationBelt
                    name={m.belt.levelName}
                    color={m.belt.color}
                    secondaryColor={m.belt.secondaryColor}
                    degree={m.belt.degree}
                    label={t("portalHome.belts.line", { level: m.belt.levelName, degree: m.belt.degree })}
                  />
                ) : (
                  <span className="text-sidebar-foreground/70">{t("portalCard.noBelt")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-sidebar-foreground/20 px-5 py-3 text-xs text-sidebar-foreground/70">
        <p>{t("portalCard.validOn", { date: formatDate(data.today) })}</p>
        {!compact && <p>{t("portalCard.madeWith")}</p>}
      </div>
    </article>
  );
}
