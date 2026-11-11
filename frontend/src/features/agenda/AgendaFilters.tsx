import { useTranslation } from "react-i18next";
import type { AgendaData } from "./useAgenda";
import { Select } from "@/components/ui/field";
import { PillFilter } from "@/components/ui/pill-filter";
import { modalityColor } from "./LessonCard";

export interface FilterValues {
  unitId: string;
  teacherId: string;
  modalityId: string;
}

// RF-AGE-01: professor e modalidade em pílula; a unidade só aparece quando o alcance tem mais de uma. A legenda usa a mesma cor dos cartões (some no celular, R6).
export function AgendaFilters({ options, values, onChange, noLegend }: { options?: AgendaData; values: FilterValues; onChange: (v: Partial<FilterValues>) => void; noLegend?: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {options && options.units.length > 1 && (
        <label className="flex items-center gap-2 text-sm">
          {t("agenda.filters.unit")}
          <Select className="h-9 min-h-0 w-auto" value={values.unitId || options.unit?.id || ""} onChange={(e) => onChange({ unitId: e.target.value, teacherId: "", modalityId: "" })}>
            {options.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </label>
      )}
      <PillFilter label={t("agenda.filters.teacher")} value={values.teacherId} onChange={(teacherId) => onChange({ teacherId })} allLabel={t("agenda.filters.allTeachersShort")} options={options?.teachers ?? []} />
      <PillFilter
        label={t("agenda.filters.modality")}
        value={values.modalityId}
        onChange={(modalityId) => onChange({ modalityId })}
        allLabel={t("agenda.filters.allModalitiesShort")}
        options={(options?.modalities ?? []).map((m) => ({ ...m, dot: true }))}
      />
      {!noLegend && (
        <ul aria-label={t("agenda.legend")} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {(options?.modalities ?? []).map((m) => (
            <li key={m.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: modalityColor(m.id) }} />
              {m.name}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
