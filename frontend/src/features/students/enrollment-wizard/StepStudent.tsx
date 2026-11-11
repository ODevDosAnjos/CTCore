import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { CpfField, PhoneField } from "@/components/fields/fields";
import { isValidCpf, isValidPhone, onlyDigits } from "@/components/fields/masks";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Field, Select } from "@/components/ui/field";
import { LogoCropDialog } from "@/features/organization/LogoCropDialog";
import { checkLogoFile, LOGO_TYPES } from "@/features/organization/logoFile";
import { Text } from "@/features/units/Text";
import { ApiError } from "@/lib/api";
import { PickSelect } from "../ModalityPickers";
import { uploadStudentPhoto, useResource } from "../useStudentRecord";
import type { StudentInput, StudentRef } from "../types";
import { createStudent, lookupByCpf } from "./api";
import { ageOf } from "./enrollmentFormat";
import { FooterBar } from "./FooterBar";
import { GuardianCard } from "./GuardianCard";
import { newGuardian, type StudentDraft, type WizardStudent } from "./types";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const REFERRALS = ["INSTAGRAM", "REFERRAL", "DIRECTORY", "WALK_BY", "OTHER"];
const FIELD_KEY: Record<string, string> = { registeredUnitId: "unitId" };

const isAdult = (birth: string) => {
  const limit = new Date(`${birth}T00:00:00`);
  limit.setFullYear(limit.getFullYear() + 18);
  return limit.getTime() <= Date.now();
};

type Phase = { kind: "search" } | { kind: "found"; student: WizardStudent };
type AgeRange = { id: string; name: string; minAge: number; maxAge: number | null };

// Etapa 1 (RF-MAT-01, RN-ALU-06, RN-MAT-19): CPF com "Buscar" e, abaixo, o cadastro completo num só cartão. O aluno que já existe aparece só
// com nome, foto e situação; o novo é cadastrado pelo POST /students ao Continuar (a busca por CPF vem antes quando ainda não foi feita).
export function StepStudent({
  draft,
  onDraft,
  onConfirm,
  onCancel,
}: {
  draft: StudentDraft;
  onDraft: Dispatch<SetStateAction<StudentDraft>>;
  onConfirm: (s: WizardStudent, photoFailed?: boolean) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.student.";
  const f = `${k}form.`;
  const units = useResource<{ units: { id: string; name: string }[] }>("/units/reachable");
  const ranges = useResource<{ items: AgeRange[] }>("/age-ranges");
  const [phase, setPhase] = useState<Phase>({ kind: "search" });
  const [searched, setSearched] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<"error" | "forbidden" | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [possible, setPossible] = useState<StudentRef>();
  const [formError, setFormError] = useState<string>();
  const [photoNotice, setPhotoNotice] = useState<string>();
  const [cropping, setCropping] = useState<File | null>(null);

  const set = <K extends keyof StudentDraft>(key: K) => (v: StudentDraft[K]) => onDraft((p) => ({ ...p, [key]: v }));
  const minor = Boolean(draft.birthDate) && !isAdult(draft.birthDate);
  const age = draft.birthDate ? ageOf(draft.birthDate) : undefined;
  const range = age === undefined ? undefined : ranges.data?.items.find((r) => age >= r.minAge && (r.maxAge === null || age <= r.maxAge));
  const missingGuardian = minor && !draft.guardians.some((g) => g.name.trim());
  const required = t(`${f}required`);

  const setGuardian = (i: number, patch: Partial<StudentDraft["guardians"][number]>) =>
    onDraft((p) => ({ ...p, guardians: p.guardians.map((g, j) => (j === i ? { ...g, ...patch } : g)) }));
  const makeFinancial = (i: number) => onDraft((p) => ({ ...p, guardians: p.guardians.map((g, j) => ({ ...g, financial: j === i })) }));

  function validate() {
    const e: Record<string, string> = {};
    if (!minor && !draft.cpf) e.cpf = required;
    if (draft.cpf && !isValidCpf(draft.cpf)) e.cpf = t("fields.cpfInvalid");
    if (draft.name.trim().length < 2) e.name = required;
    if (!draft.birthDate) e.birthDate = required;
    if (!draft.unitId) e.unitId = required;
    if (draft.birthDate && !minor) {
      if (!draft.email.trim() || !EMAIL.test(draft.email.trim())) e.email = t(`${f}emailInvalid`);
      if (!isValidPhone(draft.phone)) e.phone = t(`${f}phoneInvalid`);
    }
    if (onlyDigits(draft.postalCode).length !== 8) e.postalCode = t(`${f}postalCodeInvalid`);
    for (const key of ["street", "number", "district", "city"] as const) if (!draft[key].trim()) e[key] = required;
    if (!STATES.includes(draft.state)) e.state = required;
    if (minor) {
      draft.guardians.forEach((g, i) => {
        if (g.name.trim().length < 2) e[`guardian${i}Name`] = t(`${f}guardianRequired`);
        if (!isValidCpf(g.cpf)) e[`guardian${i}Cpf`] = t(`${f}guardianRequired`);
        if (!EMAIL.test(g.email.trim())) e[`guardian${i}Email`] = t(`${f}emailInvalid`);
        if (!isValidPhone(g.phone)) e[`guardian${i}Phone`] = t(`${f}phoneInvalid`);
      });
    }
    const given = [draft.emergencyName.trim(), draft.emergencyRelationship.trim(), draft.emergencyPhone].filter(Boolean).length;
    if (given > 0 && given < 3) {
      const all = t("students.edit.emergencyAll");
      if (!draft.emergencyName.trim()) e.emergencyName = all;
      else if (!draft.emergencyRelationship.trim()) e.emergencyRelationship = all;
      else e.emergencyPhone = all;
    }
    return e;
  }

  // Busca por CPF (RN-ALU-06): "found" mostra o cartão da situação e esconde o cadastro; "new" segue para o cadastro; "failed" abre o estado de erro.
  async function lookup(): Promise<"found" | "new" | "failed"> {
    try {
      const found = await lookupByCpf(draft.cpf);
      setPhase({ kind: "found", student: { id: found.id, name: found.name, photoUrl: found.photoUrl, enrollmentStatus: found.enrollmentStatus } });
      setSearched(draft.cpf);
      return "found";
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setSearched(draft.cpf);
        return "new";
      }
      setFailure(e instanceof ApiError && e.status === 403 ? "forbidden" : "error");
      return "failed";
    }
  }

  async function search() {
    if (busy || !isValidCpf(draft.cpf)) return;
    setBusy(true);
    setFailure(null);
    await lookup();
    setBusy(false);
  }

  async function proceed(confirmDuplicate = false) {
    if (busy) return;
    if (phase.kind === "found") return onConfirm(phase.student);
    setBusy(true);
    setFailure(null);
    setFormError(undefined);
    try {
      if (isValidCpf(draft.cpf) && searched !== draft.cpf && (await lookup()) !== "new") return;
      const found = validate();
      setErrors(found);
      if (Object.keys(found).length > 0) return;
      setPossible(undefined);
      const body: StudentInput = {
        registeredUnitId: draft.unitId,
        name: draft.name.trim(),
        birthDate: draft.birthDate,
        postalCode: onlyDigits(draft.postalCode),
        street: draft.street.trim(),
        number: draft.number.trim(),
        district: draft.district.trim(),
        city: draft.city.trim(),
        state: draft.state,
        cpf: draft.cpf || null,
        email: draft.email.trim() || null,
        phone: draft.phone || null,
        referral: draft.referral || null,
        emergencyName: draft.emergencyName.trim() || null,
        emergencyRelationship: draft.emergencyRelationship.trim() || null,
        emergencyPhone: draft.emergencyPhone || null,
        confirmDuplicate,
        ...(minor ? { guardians: draft.guardians.map((g) => ({ name: g.name.trim(), cpf: g.cpf, email: g.email.trim(), phone: g.phone, financial: g.financial })) } : {}),
      };
      let created = await createStudent(body);
      let photoFailed = false;
      if (draft.photo) {
        try {
          created = await uploadStudentPhoto(created.id, draft.photo);
        } catch {
          photoFailed = true;
        }
      }
      onConfirm({ id: created.id, name: created.name, photoUrl: created.photoUrl, enrollmentStatus: "NONE" }, photoFailed);
    } catch (e) {
      if (!(e instanceof ApiError)) return setFormError(t(`${f}error`));
      const field = (name: string) => e.fields.find((x) => x.field === name)?.message ?? "";
      const ref = (): StudentRef => ({ id: field("id"), name: field("name"), photoUrl: field("photoUrl") || null });
      if (e.code === "STUDENT_CPF_EXISTS") setPhase({ kind: "found", student: { ...ref(), enrollmentStatus: "NONE" } });
      else if (e.code === "STUDENT_POSSIBLE_DUPLICATE") setPossible(ref());
      else if (e.fields.length > 0) {
        setErrors(Object.fromEntries(e.fields.map((x) => [x.field.startsWith("guardians") ? "guardians" : (FIELD_KEY[x.field] ?? x.field.split(".").pop()!), x.message])));
      } else setFormError(t(`${f}error`));
    } finally {
      setBusy(false);
    }
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    const problem = checkLogoFile(file);
    if (problem) return setPhotoNotice(t(problem === "type" ? "students.edit.photoTypeError" : "students.edit.photoSizeError"));
    setPhotoNotice(undefined);
    setCropping(file);
  }

  if (failure === "forbidden") return <ForbiddenState />;
  if (failure === "error") return <ErrorState onRetry={() => void proceed()} />;
  if (units.status === "loading" || units.status === "idle") return <LoadingState />;
  if (units.status === "forbidden") return <ForbiddenState />;
  if (units.status === "error" || units.status === "notFound") return <ErrorState onRetry={units.reload} />;

  const existing = phase.kind === "found" ? phase.student : null;
  return (
    <>
    <form
      noValidate
      aria-busy={busy}
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void proceed();
      }}
    >
      <p className="text-sm text-muted-foreground">{t(`${k}intro`)}</p>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1 basis-48">
          <CpfField
            label={minor ? t(`${k}cpfOptional`) : t(`${k}cpf`)}
            initial={draft.cpf}
            onChange={(v) => {
              onDraft((p) => ({ ...p, cpf: v }));
              setPhase({ kind: "search" });
              setSearched("");
            }}
          />
          {errors.cpf && !draft.cpf && <p className="text-xs text-danger-foreground">{errors.cpf}</p>}
        </div>
        <Button type="button" variant="outline" className="min-h-11 sm:mt-6" disabled={busy || !isValidCpf(draft.cpf)} onClick={() => void search()}>
          {t(`${k}search`)}
        </Button>
      </div>
      {busy && <LoadingState />}
      {existing && (
        <section aria-label={t(`${k}foundTitle`)} className="flex flex-col gap-3 rounded-md border p-3">
          <div className="flex items-center gap-3">
            {existing.photoUrl ? <img src={existing.photoUrl} alt="" className="size-12 shrink-0 rounded-full object-cover" /> : <Avatar name={existing.name} decorative size="lg" />}
            <div className="min-w-0">
              <p className="break-words font-medium">{existing.name}</p>
              <p className="text-sm text-muted-foreground">{t(`${k}status.${existing.enrollmentStatus}`)}</p>
            </div>
          </div>
          <Button type="button" className="min-h-11 self-start" onClick={() => onConfirm(existing)}>
            {t(`${k}confirm`)}
          </Button>
        </section>
      )}
      {!existing && (
        <>
          {formError && <Banner tone="danger">{formError}</Banner>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text required label={t(`${f}name`)} value={draft.name} onChange={set("name")} error={errors.name} autoComplete="off" />
            <Field required label={t(`${f}birthDate`)} hint={age === undefined ? undefined : range ? t(`${f}ageRange`, { age, range: range.name }) : t(`${f}age`, { age })} error={errors.birthDate}>
              {(c) => <DateField {...c} value={draft.birthDate} onChange={(e) => set("birthDate")(e.target.value)} />}
            </Field>
          </div>
          {possible && (
            <div role="alert" className="flex flex-col gap-2 rounded-md border p-3 text-sm">
              <p>{t(`${f}possibleDuplicate`, { name: possible.name })}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="min-h-11" onClick={() => setPhase({ kind: "found", student: { ...possible, enrollmentStatus: "NONE" } })}>
                  {t(`${f}useExisting`)}
                </Button>
                <Button type="button" className="min-h-11" onClick={() => void proceed(true)}>
                  {t(`${f}createAnyway`)}
                </Button>
              </div>
            </div>
          )}
          <PickSelect label={t(`${f}unit`)} value={draft.unitId} onChange={set("unitId")} options={units.data?.units ?? []} error={errors.unitId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Text required={!minor} label={t(`${f}email`)} type="email" value={draft.email} onChange={set("email")} error={errors.email} />
            <div>
              <PhoneField required={!minor} label={t(`${f}phone`)} initial={draft.phone} onChange={set("phone")} />
              {errors.phone && <p className="text-xs text-danger-foreground">{errors.phone}</p>}
            </div>
          </div>
          <Text label={t(`${f}postalCode`)} value={draft.postalCode} onChange={set("postalCode")} error={errors.postalCode} inputMode="numeric" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-3">
              <Text label={t(`${f}street`)} value={draft.street} onChange={set("street")} error={errors.street} />
            </div>
            <Text label={t(`${f}number`)} value={draft.number} onChange={set("number")} error={errors.number} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Text label={t(`${f}district`)} value={draft.district} onChange={set("district")} error={errors.district} />
            <Text label={t(`${f}city`)} value={draft.city} onChange={set("city")} error={errors.city} />
            <PickSelect label={t(`${f}state`)} value={draft.state} onChange={set("state")} options={STATES.map((s) => ({ id: s, name: s }))} error={errors.state} />
          </div>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold">{t(`${f}guardians`)}</legend>
            <p className="text-sm text-muted-foreground">{minor ? t(`${f}guardianHelp`) : t(`${f}guardiansAdult`)}</p>
            {errors.guardians && <p className="text-xs text-danger-foreground">{errors.guardians}</p>}
            {minor &&
              draft.guardians.map((g, i) => (
                <GuardianCard
                  key={g.key}
                  index={i}
                  value={g}
                  errors={errors}
                  alone={draft.guardians.length === 1}
                  onChange={(patch) => setGuardian(i, patch)}
                  onFinancial={() => makeFinancial(i)}
                  onRemove={
                    i > 0
                      ? () => onDraft((p) => ({ ...p, guardians: p.guardians.filter((_, j) => j !== i).map((x, j) => (j === 0 ? { ...x, financial: true } : x)) }))
                      : undefined
                  }
                />
              ))}
            {minor && draft.guardians.length < 2 && (
              <Button type="button" variant="outline" className="min-h-11 self-start" onClick={() => onDraft((p) => ({ ...p, guardians: [...p.guardians, newGuardian(false)] }))}>
                {t(`${f}guardianAdd`)}
              </Button>
            )}
          </fieldset>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={draft.name.trim() || "?"} decorative size="lg" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{t(`${f}photo`)}</span>
              <p className="text-sm text-muted-foreground">{draft.photo ? t(`${f}photoChosen`) : t("students.edit.photoHint")}</p>
              <input
                type="file"
                hidden
                id="wizard-photo"
                aria-label={t("students.edit.photoFile")}
                accept={LOGO_TYPES.join(",")}
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="min-h-11" onClick={() => document.getElementById("wizard-photo")?.click()}>
                  {draft.photo ? t("students.edit.photoReplace") : t("students.edit.photoChoose")}
                </Button>
                {draft.photo && (
                  <Button type="button" variant="outline" className="min-h-11" onClick={() => set("photo")(null)}>
                    {t("students.edit.photoRemove")}
                  </Button>
                )}
              </div>
              {photoNotice && <Banner tone="danger">{photoNotice}</Banner>}
            </div>
          </div>
          <Field label={t(`${f}referral`)}>
            {(c) => (
              <Select {...c} value={draft.referral} onChange={(e) => set("referral")(e.target.value)}>
                <option value="">{t("students.edit.none")}</option>
                {REFERRALS.map((r) => (
                  <option key={r} value={r}>
                    {t(`students.edit.referrals.${r}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-semibold">{t(`${f}emergency`)}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Text label={t("students.edit.emergencyName")} value={draft.emergencyName} onChange={set("emergencyName")} error={errors.emergencyName} autoComplete="off" />
              <Text label={t("students.edit.emergencyRelationship")} value={draft.emergencyRelationship} onChange={set("emergencyRelationship")} error={errors.emergencyRelationship} autoComplete="off" />
              <div>
                <PhoneField label={t("students.edit.emergencyPhone")} initial={draft.emergencyPhone} onChange={set("emergencyPhone")} autoComplete="off" />
                {errors.emergencyPhone && <p className="text-xs text-danger-foreground">{errors.emergencyPhone}</p>}
              </div>
            </div>
          </fieldset>
        </>
      )}
      <FooterBar notice={missingGuardian && !existing ? <Banner tone="warn">{t(`${f}minorNotice`)}</Banner> : undefined}>
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" className="min-h-11" disabled={busy || (missingGuardian && !existing)}>
          {t("enrollmentWizard.continue")}
          <ArrowRight aria-hidden="true" />
        </Button>
      </FooterBar>
    </form>
      {cropping && (
        <LogoCropDialog
          file={cropping}
          labels={{ title: t("students.edit.cropTitle"), hint: t("students.edit.cropHint"), preview: t("students.edit.cropPreview"), error: t("students.edit.photoTypeError") }}
          onCancel={() => setCropping(null)}
          onConfirm={async (blob) => {
            set("photo")(blob);
            setCropping(null);
          }}
        />
      )}
    </>
  );
}
