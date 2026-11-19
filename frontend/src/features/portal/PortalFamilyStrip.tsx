import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HomeStudent } from "./usePortalHome";

type Props = { students: HomeStudent[]; selected: string | null; familyView: boolean; familyOpenCents: number; onSelect: (id: string) => void; onFamily: () => void };

const BTN = "flex min-h-11 items-center gap-2 rounded-full border px-3 text-left text-sm md:min-w-44 md:rounded-card md:p-3";

// RN-POR-05: um cartão por aluno ligado ("Você" no próprio), "Toda a família" e o total em aberto; no celular viram pílulas.
// O resto da tela é do cartão escolhido; "Toda a família" só mostra o total (D5).
export function PortalFamilyStrip({ students, selected, familyView, familyOpenCents, onSelect, onFamily }: Props) {
  const { t } = useTranslation();
  const pick = (on: boolean) => (on ? "border-primary bg-secondary" : "bg-card");
  return (
    <section aria-label={t("portalHome.family.label")} className="mb-4">
      <ul className="flex gap-2 overflow-x-auto pb-2">
        {students.map((s) => {
          const name = s.self ? t("portalHome.family.you") : s.name;
          return (
            <li key={s.id} className="shrink-0">
              <button type="button" aria-pressed={!familyView && s.id === selected} onClick={() => onSelect(s.id)} className={cn(BTN, pick(!familyView && s.id === selected))}>
                <Avatar name={s.name} decorative size="sm" className="max-md:hidden" />
                <span className="flex min-w-0 flex-col">
                  <span className="break-words font-medium">{name}</span>
                  <span className={cn("text-xs max-md:hidden", s.openCents > 0 ? "text-warn-foreground" : "text-ok-foreground")}>
                    {s.openCents > 0 ? t("portalHome.family.due", { value: formatCurrency(s.openCents) }) : t("portalHome.family.upToDate")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        <li className="shrink-0">
          <button type="button" aria-pressed={familyView} onClick={onFamily} className={cn(BTN, pick(familyView))}>
            <Users aria-hidden="true" className="size-4 max-md:hidden" />
            <span className="font-medium">{t("portalHome.family.all")}</span>
          </button>
        </li>
      </ul>
      <p className="font-medium">{t("portalHome.family.total", { value: formatCurrency(familyOpenCents) })}</p>
    </section>
  );
}
