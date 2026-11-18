import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBelowMd } from "@/components/query/useBelowSm";
import { usePopover } from "@/components/layout/usePopover";
import { DateField } from "@/components/ui/date-field";
import { PillFilter } from "@/components/ui/pill-filter";
import { useStudentFilterOptions } from "@/features/students/useStudents";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ANNOUNCEMENT_TYPES } from "./types";

type Props = { get: (k: string) => string; set: (k: string, v: string) => void };

// "Período" do canvas: pílula que abre dois campos de data; sem datas vale "Últimos 30 dias" (o padrão da lista).
function PeriodPill({ get, set }: Props) {
  const { t } = useTranslation();
  const { open, setOpen, root, button } = usePopover();
  const from = get("from");
  const to = get("to");
  const active = Boolean(from || to);
  const day = (v: string) => (v ? formatDate(v).slice(0, 5) : "…");
  const label = active ? `${day(from)} – ${day(to)}` : t("announcements.filters.last30");
  return (
    <div ref={root} className="relative min-w-0">
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-active={active || undefined}
        onClick={() => setOpen(!open)}
        className={cn(
          "relative inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm after:absolute after:left-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "border-primary bg-primary/10" : "border-input bg-card hover:bg-surface-soft",
        )}
      >
        <span className="text-muted-foreground">{t("announcements.filters.period")}</span> <span className="truncate font-medium">{label}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div role="dialog" aria-label={t("announcements.filters.period")} className="absolute left-0 top-full z-40 mt-1 flex w-64 max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-md border bg-popover p-3 text-sm shadow-menu">
          <label className="flex flex-col gap-1">
            {t("announcements.filters.from")}
            <DateField value={from} onChange={(e) => set("from", e.target.value)} />
          </label>
          <label className="flex flex-col gap-1">
            {t("announcements.filters.to")}
            <DateField value={to} onChange={(e) => set("to", e.target.value)} />
          </label>
          <button
            type="button"
            className="min-h-11 rounded-md px-3 text-left hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:font-medium"
            aria-pressed={!active}
            onClick={() => {
              set("from", "");
              set("to", "");
              setOpen(false);
            }}
          >
            {t("announcements.filters.last30")}
          </button>
        </div>
      )}
    </div>
  );
}

// Filtros de Comunicação › Comunicados (RF-COM-01): Período, Turma e Tipo em pílulas; a unidade vem do alcance do perfil. No celular não há filtros (canvas).
export function AnnouncementFilters({ get, set }: Props) {
  const { t } = useTranslation();
  const { classes } = useStudentFilterOptions();
  if (useBelowMd()) return null;
  return (
    <>
      <PeriodPill get={get} set={set} />
      <PillFilter label={t("announcements.filters.class")} value={get("classId")} onChange={(v) => set("classId", v)} allLabel={t("announcements.filters.allClasses")} options={classes} />
      <PillFilter
        label={t("announcements.filters.type")}
        value={get("type")}
        onChange={(v) => set("type", v)}
        allLabel={t("announcements.filters.allTypes")}
        options={ANNOUNCEMENT_TYPES.map((id) => ({ id, name: t(`announcements.types.${id}`) }))}
      />
    </>
  );
}
