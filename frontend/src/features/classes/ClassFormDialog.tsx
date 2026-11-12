import { useState } from "react";
import { createPortal } from "react-dom";
import { Link2, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LastChange } from "@/components/LastChange";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select } from "@/components/ui/field";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { ApiError } from "@/lib/api";
import { createClass, updateClass, useClassOptions, type ClassDetail, type ClassInput, type ClassOptions } from "./useClasses";

type FieldName = "unit" | "name" | "modality" | "ageRange" | "schedule" | "capacity" | "head" | "assistants" | "link" | "form";
type Errors = Partial<Record<FieldName, string>>;
type Row = { key: number; weekday: number; from: string; to: string };
// Campo do servidor -> campo da tela.
const FIELD: Record<string, FieldName> = { unitId: "unit", name: "name", modalityId: "modality", ageRangeId: "ageRange", schedule: "schedule", capacity: "capacity", headTeacherId: "head", assistantIds: "assistants", groupLink: "link" };
const DAYS = [1, 2, 3, 4, 5, 6, 7];
const FORM_ID = "class-form";

// RF-TUR-03: criação (sem `klass`) e edição da turma. O servidor reconfere tudo (alcance, unicidade do nome, titular ativo).
export function ClassFormDialog({ open, klass, onClose, onSaved }: { open: boolean; klass?: ClassDetail; onClose: () => void; onSaved: (saved: ClassDetail) => void }) {
  const { t } = useTranslation();
  const loaded = useClassOptions(open);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  if (!open) return null;
  return (
    <Modal
      open
      size="lg"
      scrim="canvas"
      onOpenChange={(o) => !o && onClose()}
      title={t(klass ? "classes.form.editTitle" : "classes.form.newTitle")}
      footer={loaded.options ? <div ref={setFooter} className="flex flex-1 flex-wrap items-center justify-between gap-2" /> : undefined}
    >
      {loaded.status === "loading" && <LoadingState />}
      {loaded.status === "forbidden" && <ForbiddenState />}
      {loaded.status === "error" && <ErrorState onRetry={loaded.retry} />}
      {loaded.options && <Form key={klass?.id ?? "new"} options={loaded.options} klass={klass} footer={footer} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

let rowKey = 0;
const initialRows = (klass?: ClassDetail): Row[] => (klass?.schedule ?? []).map((s) => ({ key: ++rowKey, weekday: s.weekday, from: s.startsAt, to: s.endsAt }));
const byDay = (rows: Row[]) => [...rows].sort((a, b) => a.weekday - b.weekday).map((r) => ({ weekday: r.weekday, startsAt: r.from, endsAt: r.to }));

function Form({ options, klass, footer, onClose, onSaved }: { options: ClassOptions; klass?: ClassDetail; footer: HTMLElement | null; onClose: () => void; onSaved: (saved: ClassDetail) => void }) {
  const { t } = useTranslation();
  const scope = useUnitScope();
  // Na criação a unidade vem do escopo da barra; o campo só aparece com "todas" (ou escopo fora das opções).
  const scoped = options.units.find((u) => u.id === scope.selected);
  const [unitId, setUnitId] = useState(klass?.unit.id ?? scoped?.id ?? (options.units.length === 1 ? options.units[0].id : ""));
  const unit = options.units.find((u) => u.id === unitId);
  const [name, setName] = useState(klass?.name ?? "");
  const [ageRangeId, setAgeRangeId] = useState(klass?.ageRange?.id ?? "");
  const [rows, setRows] = useState(() => initialRows(klass));
  const [capacity, setCapacity] = useState(klass?.capacity?.toString() ?? "");
  const [modalityId, setModalityId] = useState(klass?.modality.id ?? "");
  const unitTeachers = unit?.teachers ?? [];
  const teachers = unitTeachers.filter((x) => x.modalityIds.includes(modalityId));
  // Titular inativo (ou que saiu da unidade/modalidade) não é escolha: o campo volta vazio e pede um novo (RN-PRO-05).
  const headGone = !!klass && !teachers.some((x) => x.id === klass.head.id);
  const headCannotTeach = headGone && unitTeachers.some((x) => x.id === klass?.head.id);
  const [headId, setHeadId] = useState(headGone ? "" : (klass?.head.id ?? ""));
  const [assistants, setAssistants] = useState(() => (klass?.assistants ?? []).map((a) => a.id).filter((id) => teachers.some((x) => x.id === id)));
  const [query, setQuery] = useState("");
  const [link, setLink] = useState(klass?.groupLink ?? "");
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<Errors>(
    headGone && klass
      ? { head: t(headCannotTeach ? "classes.form.headCannotTeach" : "classes.form.headGone", { name: klass.head.name, modality: klass.modality.name, unit: klass.unit.name }) }
      : {},
  );
  const [busy, setBusy] = useState(false);

  const schedule = byDay(rows);
  const changed = !!klass && JSON.stringify(schedule) !== JSON.stringify(klass.schedule);
  // R14: com o titular fora, só Nome, Modalidade, titular e auxiliares aparecem até escolher outro.
  const compact = !!klass && headGone && !headId;

  function pickUnit(id: string) {
    setUnitId(id);
    const next = options.units.find((u) => u.id === id);
    const modalityKept = !!next?.modalities.some((m) => m.id === modalityId);
    if (!modalityKept) setModalityId("");
    const can = (tid: string) => modalityKept && !!next?.teachers.some((x) => x.id === tid && x.modalityIds.includes(modalityId));
    if (!can(headId)) setHeadId("");
    setAssistants((a) => a.filter(can));
  }

  // RN-TUR-05: ao trocar a modalidade, titular e auxiliares que não a ensinam saem da escolha.
  function pickModality(id: string) {
    setModalityId(id);
    const teaches = (tid: string) => unitTeachers.some((x) => x.id === tid && x.modalityIds.includes(id));
    if (!teaches(headId)) setHeadId("");
    setAssistants((a) => a.filter(teaches));
  }

  const setRow = (key: number, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  // Um horário por dia (RF-TUR-03): o dia já usado não é oferecido nas outras linhas.
  const freeDays = DAYS.filter((d) => !rows.some((r) => r.weekday === d));
  const addRow = () => freeDays.length && setRows((all) => [...all, { key: ++rowKey, weekday: freeDays[0], from: "19:00", to: "20:00" }]);

  function validate(): Errors {
    const found: Errors = {};
    const n = name.trim();
    if (!klass && !unitId) found.unit = t("classes.form.unitRequired");
    if (n.length < 2 || n.length > 80) found.name = t("classes.form.nameInvalid");
    if (!modalityId) found.modality = t("classes.form.modalityRequired");
    if (!headId) found.head = t("classes.form.headRequired");
    if (compact) return found;
    if (schedule.length === 0) found.schedule = t("classes.form.scheduleRequired");
    else if (schedule.some((s) => !s.startsAt || !s.endsAt || s.endsAt <= s.startsAt)) found.schedule = t("classes.form.scheduleOrder");
    const cap = capacity.trim();
    if (cap && !(/^\d+$/.test(cap) && Number(cap) >= 1 && Number(cap) <= 200)) found.capacity = t("classes.form.capacityInvalid");
    if (link.trim() && !/^https?:\/\/\S+$/.test(link.trim())) found.link = t("classes.form.linkInvalid");
    return found;
  }

  async function submit() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;
    const input: ClassInput = {
      name: name.trim(),
      modalityId,
      ageRangeId: ageRangeId || null,
      schedule,
      capacity: capacity.trim() ? Number(capacity) : null,
      headTeacherId: headId,
      assistantIds: assistants.filter((a) => a !== headId),
      groupLink: link.trim() || null,
      ...(klass ? (changed ? { notifyClass: notify } : {}) : { unitId }),
    };
    setBusy(true);
    try {
      const saved = klass ? await updateClass(klass.id, input) : await createClass(input);
      onClose();
      onSaved(saved);
    } catch (e) {
      const next: Errors = {};
      if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[FIELD[f.field] ?? "form"] = f.message;
      else next.form = t(e instanceof ApiError && e.status === 409 ? "classes.form.conflict" : "classes.form.error");
      setErrors(next);
    } finally {
      setBusy(false);
    }
  }

  const matches = query.trim()
    ? teachers.filter((x) => x.id !== headId && !assistants.includes(x.id) && x.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")))
    : [];
  const nameOf = (id: string) => unitTeachers.find((x) => x.id === id)?.name ?? klass?.assistants.find((a) => a.id === id)?.name ?? "";

  return (
    <>
      <form
        id={FORM_ID}
        noValidate
        className="flex flex-col gap-4"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        {compact && <p className="text-sm text-muted-foreground">{t("classes.form.headSwap")}</p>}
        {!klass && !scoped && (
          <Field label={t("classes.form.unit")} error={errors.unit}>
            {(c) => (
              <Select {...c} className="min-h-11" value={unitId} onChange={(e) => pickUnit(e.target.value)}>
                <option value="">{t("classes.form.choose")}</option>
                {options.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("classes.form.name")} error={errors.name} hint={t("classes.form.nameHelp")}>
            {(c) => <Input {...c} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
          </Field>
          <Field label={t("classes.form.modality")} error={errors.modality} hint={klass ? t("classes.form.unitFixed") : undefined}>
            {(c) =>
              klass ? (
                <Input {...c} value={klass.modality.name} readOnly />
              ) : (
                <Select {...c} className="min-h-11" value={modalityId} onChange={(e) => pickModality(e.target.value)}>
                  <option value="">{t("classes.form.choose")}</option>
                  {(unit?.modalities ?? []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )
            }
          </Field>
          {!compact && (
            <Field label={t("classes.form.ageRange")} error={errors.ageRange}>
              {(c) => (
                <Select {...c} className="min-h-11" value={ageRangeId} onChange={(e) => setAgeRangeId(e.target.value)}>
                  <option value="">{t("classes.form.noAgeRange")}</option>
                  {options.ageRanges.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </div>
        {!compact && (
          <fieldset aria-describedby={errors.schedule ? "class-schedule-erro" : undefined} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{t("classes.form.schedule")}</legend>
            {rows.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-1 font-medium">{t("classes.form.day")}</th>
                    <th className="pb-1 font-medium">{t("classes.form.start")}</th>
                    <th className="pb-1 font-medium">{t("classes.form.end")}</th>
                    <th className="pb-1">
                      <span className="sr-only">{t("classes.form.removeColumn")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const day = t(`classes.weekdaysLong.${r.weekday}`);
                    return (
                      <tr key={r.key}>
                        <td className="py-1 pr-2">
                          <Select className="min-h-11" aria-label={t("classes.form.dayOf", { day })} value={r.weekday} onChange={(e) => setRow(r.key, { weekday: Number(e.target.value) })}>
                            {DAYS.filter((d) => d === r.weekday || freeDays.includes(d)).map((d) => (
                              <option key={d} value={d}>
                                {t(`classes.weekdaysLong.${d}`)}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="py-1 pr-2">
                          <Input type="time" className="min-h-11" aria-label={t("classes.form.from", { day })} value={r.from} onChange={(e) => setRow(r.key, { from: e.target.value })} />
                        </td>
                        <td className="py-1 pr-2">
                          <Input type="time" className="min-h-11" aria-label={t("classes.form.to", { day })} value={r.to} onChange={(e) => setRow(r.key, { to: e.target.value })} />
                        </td>
                        <td className="py-1">
                          <Button type="button" variant="ghost" size="icon" aria-label={t("classes.form.removeRow", { day })} onClick={() => setRows((all) => all.filter((x) => x.key !== r.key))}>
                            <Trash2 aria-hidden />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {errors.schedule && (
              <p id="class-schedule-erro" className="text-xs text-danger-foreground">
                {errors.schedule}
              </p>
            )}
            <div>
              <Button type="button" variant="secondary" className="min-h-11" disabled={freeDays.length === 0} onClick={addRow}>
                <Plus aria-hidden />
                {t("classes.form.addRow")}
              </Button>
            </div>
            {changed && (
              <>
                <Banner tone="info">{t("classes.form.scheduleChanged")}</Banner>
                <Checkbox label={t("classes.form.notify")} checked={notify} onChange={(e) => setNotify(e.target.checked)} />
              </>
            )}
          </fieldset>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {!compact && (
            <Field label={t("classes.form.capacity")} error={errors.capacity} hint={t("classes.form.capacityHelp")}>
              {(c) => <Input {...c} type="number" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />}
            </Field>
          )}
          <Field label={t("classes.form.head")} error={errors.head} hint={t("classes.form.teachersHelp")}>
            {(c) => (
              <Select {...c} className="min-h-11" value={headId} onChange={(e) => setHeadId(e.target.value)}>
                <option value="">{t("classes.form.choose")}</option>
                {teachers.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={t("classes.form.assistants")} error={errors.assistants}>
            {(c) => (
              <div className="flex flex-col gap-2">
                <Input {...c} className="min-h-11" value={query} placeholder={t("classes.form.assistantsSearch")} autoComplete="off" onChange={(e) => setQuery(e.target.value)} />
                {matches.length > 0 && (
                  <ul className="flex flex-col rounded-md border border-input bg-card">
                    {matches.map((x) => (
                      <li key={x.id}>
                        <button
                          type="button"
                          className="w-full min-h-11 px-3 text-left text-sm hover:bg-surface-soft"
                          onClick={() => {
                            setAssistants((a) => [...a, x.id]);
                            setQuery("");
                          }}
                        >
                          {x.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {assistants.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label={t("classes.form.assistantsChosen")}>
                    {assistants.map((id) => (
                      <li key={id} className="inline-flex items-center gap-1 rounded-full border border-input bg-card py-1 pl-3 pr-1 text-sm">
                        {nameOf(id)}
                        <button type="button" className="inline-flex size-6 items-center justify-center rounded-full hover:bg-surface-soft" aria-label={t("classes.form.removeAssistant", { name: nameOf(id) })} onClick={() => setAssistants((a) => a.filter((y) => y !== id))}>
                          <X aria-hidden className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </Field>
        </div>
        {!compact && (
          <Field label={t("classes.form.link")} error={errors.link} hint={t("classes.form.linkHelp")}>
            {(c) => (
              <div className="relative">
                <Link2 aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input {...c} className="pl-9" value={link} onChange={(e) => setLink(e.target.value)} autoComplete="off" inputMode="url" />
              </div>
            )}
          </Field>
        )}
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
      </form>
      {footer &&
        createPortal(
          <>
            {klass ? <LastChange value={klass.lastChange} /> : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={busy}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" form={FORM_ID} className="min-h-11" disabled={busy}>
                {t("classes.form.save")}
              </Button>
            </div>
          </>,
          footer,
        )}
    </>
  );
}
