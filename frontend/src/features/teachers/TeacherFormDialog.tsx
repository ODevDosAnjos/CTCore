import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { PhoneField } from "@/components/fields/fields";
import { Modal } from "@/components/Modal";
import { ErrorState, LoadingState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { LogoCropDialog } from "@/features/organization/LogoCropDialog";
import { checkLogoFile, LOGO_TYPES } from "@/features/organization/logoFile";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/features/units/Text";
import { useUnitScope } from "@/features/units/UnitScopeProvider";
import { ApiError } from "@/lib/api";
import {
  createTeacher,
  grantAccess,
  removeTeacherPhoto,
  updateTeacher,
  uploadTeacherPhoto,
  useTeacherOptions,
  type TeacherDetail,
  type TeacherInput,
  type TeacherOptions,
} from "./useTeachers";
import { Select, Input, Textarea } from "@/components/ui/field";
import { Banner } from "@/components/ui/banner";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const BIO_MAX = 300;
type Errors = Partial<Record<"name" | "email" | "phone" | "bio" | "units" | "modalities" | "declared" | "form", string>>;
type Picked = Record<string, { levelId: string; degree: string }>;
// Campo do servidor -> campo da tela.
const KNOWN_INVITE = ["ALREADY_LINKED", "STAFF_LIMIT_REACHED", "FORBIDDEN", "CONFLICT"];
const list = (items: string[]) => new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(items);
const FIELD: Record<string, keyof Errors> = { name: "name", email: "email", phone: "phone", bio: "bio", unitIds: "units", modalities: "modalities", consentDeclaredByManagement: "declared" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

// RF-PRO-03: cadastro e edição do professor. Sem `teacher` cria; com ele edita. O servidor reconfere tudo (inclusive alcance).
export function TeacherFormDialog({ open, teacher, onClose, onSaved }: { open: boolean; teacher?: TeacherDetail; onClose: () => void; onSaved: (saved: TeacherDetail) => void }) {
  const { t } = useTranslation();
  const loaded = useTeacherOptions(open);
  // O rodapé fixo da janela é preenchido pelo formulário (portal), que é quem sabe o estado dos botões.
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  if (!open) return null;
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      scrim="canvas"
      title={t(teacher ? "teachers.form.editTitle" : "teachers.form.newTitle")}
      footer={loaded.options ? <div ref={setFooter} className="flex flex-1 flex-wrap justify-end gap-2" /> : undefined}
    >
      {loaded.status === "loading" && <LoadingState />}
      {loaded.status === "error" && <ErrorState onRetry={loaded.retry} />}
      {loaded.options && <Form key={teacher?.id ?? "new"} options={loaded.options} teacher={teacher} footer={footer} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Form({ options, teacher, footer, onClose, onSaved }: { options: TeacherOptions; teacher?: TeacherDetail; footer: HTMLElement | null; onClose: () => void; onSaved: (saved: TeacherDetail) => void }) {
  const { t } = useTranslation();
  const { units } = useUnitScope();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(teacher?.name ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [phone, setPhone] = useState(teacher?.phone ?? "");
  const [bio, setBio] = useState(teacher?.bio ?? "");
  const [unitIds, setUnitIds] = useState(() => (teacher?.units ?? []).map((u) => u.id).filter((id) => units.some((r) => r.id === id)));
  const [picked, setPicked] = useState<Picked>(() =>
    Object.fromEntries(
      (teacher?.modalities ?? [])
        .filter((m) => options.modalities.some((o) => o.id === m.id))
        .map((m) => [m.id, { levelId: m.levelId ?? "", degree: String(m.degree ?? 0) }]),
    ),
  );
  const [consent, setConsent] = useState(teacher?.directoryConsent ?? false);
  const [declared, setDeclared] = useState(teacher?.consentDeclaredByManagement ?? false);
  // Só no cadastro: o convite de acesso sai junto (ligado por padrão).
  const [access, setAccess] = useState(true);
  const [cropping, setCropping] = useState<File | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});
  const [blocking, setBlocking] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  // Cadastro já salvo, mas foto ou convite pendentes: cada passo pode ser repetido sem salvar de novo (D1).
  const [saved, setSaved] = useState<TeacherDetail>();
  const [photoFailed, setPhotoFailed] = useState(false);
  const [inviteError, setInviteError] = useState<string>();
  const steps = useRef<{ photo: boolean; invite: boolean; latest?: TeacherDetail }>({ photo: false, invite: false });
  const invite = !teacher && access;

  // RN-PRO-09: modalidade que o professor ensina hoje, desmarcada agora, com turma ativa dele (titular ou auxiliar).
  const leaving = (teacher?.modalities ?? [])
    .filter((m) => !picked[m.id])
    .map((m) => {
      const own = (teacher?.classes ?? []).filter((c) => c.modalityId === m.id);
      return { modality: m.name, head: own.filter((c) => c.role === "HEAD"), assistant: own.filter((c) => c.role === "ASSISTANT") };
    })
    .filter((l) => l.head.length + l.assistant.length > 0);

  function toggle(id: string, on: boolean) {
    setPicked((p) => {
      const { [id]: _drop, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
      return on ? { ...rest, [id]: { levelId: "", degree: "0" } } : rest;
    });
  }

  function pickFile(file: File | undefined) {
    if (!file) return;
    const problem = checkLogoFile(file);
    if (problem) return setPhotoNotice(t(problem === "type" ? "teachers.form.photoTypeError" : "teachers.form.photoSizeError"));
    setPhotoNotice(undefined);
    setCropping(file);
  }

  function validate(): Errors {
    const found: Errors = {};
    const n = name.trim();
    if (n.length < 2 || n.length > 80) found.name = t("teachers.form.nameInvalid");
    if (!email.trim()) found.email = t("teachers.form.emailRequired");
    else if (!EMAIL.test(email.trim())) found.email = t("teachers.form.emailInvalid");
    if (!phone) found.phone = t("teachers.form.phoneRequired");
    if (unitIds.length === 0) found.units = t("users.invite.unitsRequired");
    if (consent && !declared) found.declared = t("teachers.form.declaredRequired");
    if (options.modalities.some((o) => o.graduationEnabled && picked[o.id] && !picked[o.id].levelId)) found.modalities = t("teachers.form.levelRequired");
    return found;
  }

  function input(): TeacherInput {
    return {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone || null,
      bio: bio.trim() || null,
      directoryConsent: consent,
      consentDeclaredByManagement: declared,
      unitIds,
      modalities: options.modalities
        .filter((o) => picked[o.id])
        .map((o) => (o.graduationEnabled ? { modalityId: o.id, levelId: picked[o.id].levelId, degree: Number(picked[o.id].degree) } : { modalityId: o.id, levelId: null, degree: null })),
    };
  }

  // Depois do cadastro salvo: foto e convite. Falha mantém o cadastro e deixa repetir só o passo que falhou.
  async function finish(current: TeacherDetail) {
    const s = steps.current;
    s.latest ??= current;
    setPhotoFailed(false);
    setInviteError(undefined);
    let failed = false;
    if (!s.photo) {
      try {
        if (photo) s.latest = await uploadTeacherPhoto(current.id, photo);
        else if (removePhoto && current.photoUrl) s.latest = await removeTeacherPhoto(current.id);
        s.photo = true;
      } catch {
        setPhotoFailed(true);
        failed = true;
      }
    }
    if (invite && !s.invite) {
      try {
        await grantAccess(current.id, unitIds);
        s.invite = true;
      } catch (e) {
        setInviteError(t(`teachers.panel.grant.errors.${e instanceof ApiError && KNOWN_INVITE.includes(e.code) ? e.code : "generic"}`));
        failed = true;
      }
    }
    if (failed) return;
    onClose();
    onSaved(s.latest);
  }

  async function submit() {
    if (!saved) {
      const found = validate();
      setErrors(found);
      if (Object.keys(found).length) return;
    }
    setBusy(true);
    try {
      let current = saved;
      if (!current) {
        current = teacher ? await updateTeacher(teacher.id, input()) : await createTeacher(input());
        setSaved(current);
      }
      await finish(current);
    } catch (e) {
      const next: Errors = {};
      // RN-PRO-09: modalidade retirada com turma ativa (409): mostra as turmas que impedem.
      const inUse = e instanceof ApiError && e.code === "TEACHER_MODALITY_IN_USE";
      setBlocking(inUse ? e.fields.filter((f) => f.field === "class").map((f) => f.message) : []);
      if (inUse) next.modalities = t("teachers.form.modalityInUse");
      else if (e instanceof ApiError && e.fields.length) for (const f of e.fields) next[FIELD[f.field] ?? "form"] = f.message;
      else next.form = t("teachers.form.error");
      setErrors(next);
    } finally {
      setBusy(false);
    }
  }

  const showsPhoto = !removePhoto && !photo && teacher?.photoUrl;
  const hasPhoto = !!photo || !!showsPhoto;
  const retrying = !!saved && (photoFailed || !!inviteError);
  const first = (teacher?.name ?? name).split(/\s+/)[0];

  const chip = (label: string, checked: boolean, onChange: (on: boolean) => void): ReactNode => (
    <label key={label} className="relative inline-flex min-h-11 cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="rounded-full border border-input bg-card px-4 py-2 text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{label}</span>
    </label>
  );

  return (
    <>
      <form
        id="teacher-form"
        noValidate
        className="flex flex-col gap-4"
        aria-busy={busy}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) void submit();
        }}
      >
        <fieldset disabled={!!saved} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Text label={t("teachers.form.name")} required value={name} onChange={setName} error={errors.name} autoComplete="off" />
            <Text label={t("teachers.form.email")} required type="email" value={email} onChange={setEmail} error={errors.email} help={t("teachers.form.emailHelp")} autoComplete="off" />
            <div>
              <PhoneField label={t("teachers.form.phone")} required initial={phone} onChange={setPhone} autoComplete="off" />
              {errors.phone && <p className="text-xs text-danger-foreground">{errors.phone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset aria-describedby={errors.modalities ? "teacher-modalities-erro" : undefined}>
              <legend className="mb-1 text-sm font-medium">{t("teachers.form.modalities")}</legend>
              {options.modalities.length === 0 && <p className="text-sm text-muted-foreground">{t("teachers.form.noModalities")}</p>}
              <div className="flex flex-wrap gap-2">{options.modalities.map((o) => chip(o.name, !!picked[o.id], (on) => toggle(o.id, on)))}</div>
            </fieldset>
            <fieldset aria-describedby={errors.units ? "teacher-units-erro" : "teacher-units-dica"}>
              <legend className="mb-1 text-sm font-medium">{t("teachers.form.units")}</legend>
              <div className="flex flex-wrap gap-2">{units.map((u) => chip(u.name, unitIds.includes(u.id), (on) => setUnitIds(on ? [...unitIds, u.id] : unitIds.filter((id) => id !== u.id))))}</div>
              <p id="teacher-units-dica" className="mt-1 text-xs text-muted-foreground">
                {t("teachers.form.unitsHelp")}
              </p>
              {errors.units && (
                <p id="teacher-units-erro" className="text-xs text-danger-foreground">
                  {errors.units}
                </p>
              )}
            </fieldset>
          </div>
          {options.modalities
            .filter((o) => o.graduationEnabled && picked[o.id])
            .map((o) => {
              const sel = picked[o.id];
              const level = o.levels.find((l) => l.id === sel.levelId);
              return (
                <fieldset key={o.id} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <legend className="mb-1 text-sm font-medium">{t("teachers.form.graduation", { name: o.name })}</legend>
                  <label className="flex flex-col gap-1 text-sm">
                    {t("teachers.form.level", { name: o.name })}
                    <Select className="min-h-11" value={sel.levelId} onChange={(e) => setPicked((p) => ({ ...p, [o.id]: { levelId: e.target.value, degree: "0" } }))}>
                      <option value="">{t("teachers.form.levelChoose")}</option>
                      {o.levels.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </Select>
                  </label>
                  {level && level.maxDegree > 0 && (
                    <label className="flex flex-col gap-1 text-sm">
                      {t("teachers.form.degree", { name: o.name })}
                      <Select className="min-h-11" value={sel.degree} onChange={(e) => setPicked((p) => ({ ...p, [o.id]: { ...p[o.id], degree: e.target.value } }))}>
                        {Array.from({ length: level.maxDegree + 1 }, (_, d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </Select>
                    </label>
                  )}
                </fieldset>
              );
            })}
          {errors.modalities && (
            <p id="teacher-modalities-erro" className="text-xs text-danger-foreground">
              {errors.modalities}
            </p>
          )}
          {errors.modalities && blocking.length > 0 && (
            <Banner tone="danger">
              <ul className="list-disc pl-5">
                {blocking.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </Banner>
          )}
          {leaving.map((l) => (
            <Banner key={l.modality} tone="danger">
              <p className="font-semibold">{t("teachers.form.leaves", { modality: l.modality, name: first })}</p>
              {l.head.length > 0 && <p>{t("teachers.form.leavesHead", { classes: list(l.head.map((c) => c.name)), units: list([...new Set(l.head.map((c) => c.unitName))]) })}</p>}
              {l.assistant.length > 0 && <p>{t("teachers.form.leavesAssistant", { classes: list(l.assistant.map((c) => c.name)), units: list([...new Set(l.assistant.map((c) => c.unitName))]) })}</p>}
              <p>{t("teachers.form.leavesHelp")}</p>
            </Banner>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            {showsPhoto ? (
              <img src={teacher?.photoUrl ?? ""} alt="" className="size-16 shrink-0 rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold">
                {initials(name || teacher?.name || "")}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{t("teachers.form.photo")}</span>
              <p className="text-sm text-muted-foreground">{photo ? t("teachers.form.photoChosen") : t("teachers.form.photoHint")}</p>
              <Input
                ref={fileInput}
                type="file"
                hidden
                aria-label={t("teachers.form.photoFile")}
                accept={LOGO_TYPES.join(",")}
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="min-h-11" onClick={() => fileInput.current?.click()}>
                  {hasPhoto ? t("teachers.form.photoReplace") : t("teachers.form.photoChoose")}
                </Button>
                {hasPhoto && (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    onClick={() => {
                      setPhoto(null);
                      setRemovePhoto(true);
                    }}
                  >
                    {t("teachers.form.photoRemove")}
                  </Button>
                )}
              </div>
              {photoNotice && <Banner tone="danger">{photoNotice}</Banner>}
            </div>
          </div>
          <div>
            <label htmlFor="teacher-bio" className="block text-sm font-medium">
              {t("teachers.form.bio")}
            </label>
            <Textarea
              id="teacher-bio"
              rows={3}
              className="mt-1"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              aria-invalid={errors.bio ? true : undefined}
            />
            <p className="text-right text-xs text-muted-foreground">{t("teachers.form.bioCount", { used: bio.length, max: BIO_MAX })}</p>
            {errors.bio && <p className="text-xs text-danger-foreground">{errors.bio}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Switch checked={consent} onCheckedChange={setConsent} label={t("teachers.form.directoryConsent")} description={t("teachers.form.directoryHelp")} />
            {consent && <Checkbox label={t("teachers.form.declared")} checked={declared} onChange={(e) => setDeclared(e.target.checked)} />}
            {errors.declared && <p className="text-xs text-danger-foreground">{errors.declared}</p>}
            {!teacher && <Switch checked={access} onCheckedChange={setAccess} label={t("teachers.form.access")} description={t("teachers.form.accessHelp")} />}
          </div>
          <p className="text-xs text-muted-foreground">{t("teachers.form.noPii")}</p>
        </fieldset>
        {errors.form && <Banner tone="danger">{errors.form}</Banner>}
        {photoFailed && <Banner tone="danger">{t("teachers.form.photoUploadError")}</Banner>}
        {inviteError && (
          <Banner tone="danger">
            <p>{t("teachers.form.inviteFailed")}</p>
            <p>{inviteError}</p>
          </Banner>
        )}
      </form>
      {footer &&
        createPortal(
          <>
            {retrying ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                disabled={busy}
                onClick={() => {
                  onClose();
                  onSaved(steps.current.latest ?? saved);
                }}
              >
                {photoFailed ? t("teachers.form.closeWithoutPhoto") : t("common.close")}
              </Button>
            ) : (
              <Button type="button" variant="ghost" className="min-h-11" onClick={onClose} disabled={busy}>
                {t("common.cancel")}
              </Button>
            )}
            <Button type="submit" form="teacher-form" className="min-h-11" disabled={busy || leaving.length > 0}>
              {retrying ? (photoFailed ? t("teachers.form.photoRetry") : t("teachers.form.inviteRetry")) : invite ? t("teachers.form.saveInvite") : t("teachers.form.save")}
            </Button>
          </>,
          footer,
        )}
      {cropping && (
        <LogoCropDialog
          file={cropping}
          labels={{ title: t("teachers.form.cropTitle"), hint: t("teachers.form.cropHint"), preview: t("teachers.form.cropPreview"), error: t("teachers.form.photoTypeError") }}
          onCancel={() => setCropping(null)}
          onConfirm={async (blob) => {
            setPhoto(blob);
            setRemovePhoto(false);
            setCropping(null);
          }}
        />
      )}
    </>
  );
}
