import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Clock, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ComingSoon } from "@/components/ui/coming-soon";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { useBelowMd } from "@/components/query/useBelowSm";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FileField } from "@/components/ui/file-field";
import { RadioCard } from "@/components/ui/radio-card";
import { Input } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { SummaryBox } from "@/components/ui/summary-box";
import { br, todayIso } from "@/features/agenda/agendaDates";
import { ALL, useUnitScope } from "@/features/units/UnitScopeProvider";
import { ApiError } from "@/lib/api";
import { AnnouncementPreviewPanel, type PreviewState } from "./AnnouncementPreviewPanel";
import { AnnouncementTargetPicker, availableKinds, draftTarget, kindOf, targetName, type TargetKind } from "./AnnouncementTargetPicker";
import { BodyEditor } from "./BodyEditor";
import { ScheduleDialog } from "./ScheduleDialog";
import { TypeChips } from "./TypeChips";
import { templateFor } from "./announcementTemplates";
import { ANNOUNCEMENT_TYPES, type AnnouncementChannel, type AnnouncementDraft, type AnnouncementTargets, type AnnouncementTemplates, type AnnouncementType } from "./types";
import { createAnnouncement, fetchTargets, fetchTemplates, previewAnnouncement, uploadAnnouncementImage, useDailyLimit } from "./useAnnouncements";

const FIELD_ORDER = ["type", "title", "body", "file", "channels", "pinnedUntil", "sendAt"];
const MAX_IMAGE = 5 * 1024 * 1024;
const DEFAULT_LIMIT = 20;

// Só http e https viram link (como o painel da turma).
function safeLink(link: string | null | undefined) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function Field({ id, label, error, help, children }: { id: string; label: string; error?: string; help?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {help && !error && (
        <p id={`${id}-ajuda`} className="text-sm text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-erro`} className="text-sm text-danger-foreground">
          {error}
        </p>
      )}
    </div>
  );
}

function ChannelRow({ checked, disabled, onChange, label, hint }: { checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm">
      <input type="checkbox" className="size-4 accent-brand [color-scheme:light] dark:[color-scheme:dark]" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} />
      {label}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

function initialTarget(targets: AnnouncementTargets, p: URLSearchParams) {
  const classId = p.get("classId");
  if (classId && targets.classes.some((c) => c.id === classId)) return `CLASS:${classId}`;
  const unitId = p.get("unitId");
  return unitId && targets.units.some((u) => u.id === unitId) ? `UNIT:${unitId}` : "";
}

function Form({ targets, templates }: { targets: AnnouncementTargets; templates: AnnouncementTemplates }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const narrow = useBelowMd();
  const [params] = useSearchParams();
  const [target, setTarget] = useState(() => initialTarget(targets, params));
  // O cartão de destino vem do alvo, da URL (janela da organização) ou do primeiro que o perfil tem.
  const [kind, setKind] = useState<TargetKind | null>(() => {
    const asked = params.get("kind");
    const kinds = availableKinds(targets);
    const wanted = kindOf(initialTarget(targets, params)) ?? (asked && kinds.includes(asked as TargetKind) ? (asked as TargetKind) : kinds[0]);
    return wanted === "ORGANIZATION" ? null : (wanted ?? null);
  });
  const vars = (value: string) => {
    const date = params.get("date");
    const from = params.get("startsOn");
    const to = params.get("endsOn");
    return {
      turma: targetName(targets, value),
      data: date ? br(date) : undefined,
      horario: params.get("time") ?? undefined,
      periodo: from ? (to && to !== from ? `${br(from)} a ${br(to)}` : br(from)) : undefined,
      motivo: params.get("reason") ?? undefined,
    };
  };
  // O preenchimento vem da URL só na abertura; depois a pessoa muda tudo.
  const [start] = useState(() => {
    const asked = params.get("type") as AnnouncementType | null;
    const known = !!asked && ANNOUNCEMENT_TYPES.includes(asked);
    return { type: known ? asked : ("GENERAL" as AnnouncementType), ...(known ? templateFor(t, templates, asked, vars(target)) : { title: "", body: "" }) };
  });
  const [type, setType] = useState<AnnouncementType>(start.type);
  const [title, setTitle] = useState(start.title);
  const [body, setBody] = useState(start.body);
  const applied = useRef({ title: start.title, body: start.body });
  const [pendingType, setPendingType] = useState<AnnouncementType>();
  const [email, setEmail] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [pinnedUntil, setPinnedUntil] = useState("");
  const [mode, setMode] = useState<"NOW" | "SCHEDULED">("NOW");
  const [sendAt, setSendAt] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [image, setImage] = useState<{ name: string; url: string }>();
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState("");
  const [focusTick, setFocusTick] = useState(0);
  const [limitTick, setLimitTick] = useState(0);
  const topRef = useRef<HTMLParagraphElement>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  // A contagem do dia é da unidade escolhida na barra (RN-COM-07); sem unidade (todas), a tela segue sem ela.
  const scope = useUnitScope();
  const unitId = scope.selected && scope.selected !== ALL ? scope.selected : undefined;
  const unitName = scope.units.find((u) => u.id === unitId)?.name;
  const daily = useDailyLimit(unitId, limitTick);

  const channels: AnnouncementChannel[] = ["PORTAL", ...(email ? (["EMAIL"] as const) : []), ...(whatsapp ? (["WHATSAPP"] as const) : [])];
  const targetPart = draftTarget(target);
  const showWhatsapp = targetPart?.targetKind === "CLASS" || body.trim() !== "";
  const channelsKey = channels.join(",");

  useEffect(() => {
    const part = draftTarget(target);
    if (!part) {
      setPreview(null);
      return;
    }
    let alive = true;
    setPreview({ status: "loading" });
    previewAnnouncement({ ...part, channels: channelsKey.split(",") as AnnouncementChannel[] }).then(
      (data) => alive && setPreview({ status: "ready", data }),
      () => alive && setPreview({ status: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [target, channelsKey]);

  useEffect(() => {
    if (focusTick === 0) return;
    const first = FIELD_ORDER.find((f) => errors[f]);
    if (first) document.getElementById(`ann-${first}`)?.focus();
    else topRef.current?.focus();
  }, [focusTick]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyType(next: AnnouncementType) {
    const text = templateFor(t, templates, next, vars(target));
    setType(next);
    setTitle(text.title);
    setBody(text.body);
    applied.current = text;
    setPendingType(undefined);
  }
  function chooseType(next: AnnouncementType) {
    if (next === type) return;
    if (title !== applied.current.title || body !== applied.current.body) setPendingType(next);
    else applyType(next);
  }
  function chooseKind(next: TargetKind) {
    if (next === "ORGANIZATION") {
      navigate("/comunicados?novo=organizacao");
      return;
    }
    setKind(next);
    setTarget("");
  }

  async function chooseImage(file: File | undefined) {
    if (!file) return;
    setErrors((e) => ({ ...e, file: "" }));
    if (file.size > MAX_IMAGE) {
      setErrors((x) => ({ ...x, file: t("announcements.new.fields.file") }));
      return;
    }
    setUploading(true);
    try {
      setImage(await uploadAnnouncementImage(file));
    } catch (e) {
      setErrors((x) => ({ ...x, file: t(e instanceof ApiError && e.status === 400 ? "announcements.new.fields.file" : "announcements.new.errorGeneric") }));
    } finally {
      setUploading(false);
    }
  }

  // `at`: instante já escolhido na janela de agendar (celular); no desktop vale a opção "Agendar" de "Quando".
  async function submit(at?: string) {
    if (busy || !targetPart) return;
    setBusy(true);
    setErrors({});
    setTopError("");
    const when = at ?? (!narrow && mode === "SCHEDULED" && sendAt ? new Date(sendAt).toISOString() : undefined);
    const draft: AnnouncementDraft = {
      ...targetPart,
      type,
      title,
      body,
      channels,
      ...(image ? { imageName: image.name } : {}),
      ...(pinnedUntil ? { pinnedUntil } : {}),
      ...(when ? { sendAt: when } : {}),
      ...(params.get("noClassDayId") ? { noClassDayId: params.get("noClassDayId")! } : {}),
    };
    try {
      const created = await createAnnouncement(draft);
      const group = preview?.status === "ready" && whatsapp && preview.data.whatsapp?.mode === "GROUP" ? safeLink(preview.data.whatsapp.groupLink) : null;
      navigate("/comunicados", { state: { sent: { status: created.status, groupLink: group } } });
    } catch (err) {
      const fields: Record<string, string> = {};
      let top = "";
      if (err instanceof ApiError && err.status === 400) {
        for (const f of err.fields) {
          if (FIELD_ORDER.includes(f.field)) fields[f.field] = t(`announcements.new.fields.${f.field}`);
          else top = t("announcements.new.fields.other");
        }
        if (!err.fields.length) top = t("announcements.new.fields.other");
      } else if (err instanceof ApiError && err.code === "ANNOUNCEMENT_DAILY_LIMIT") {
        top = unitName ? t("announcements.limitBanner", { unit: unitName, limit: daily?.unit.limit ?? DEFAULT_LIMIT }) : t("announcements.new.errorLimit");
        setLimitTick((n) => n + 1);
      } else if (err instanceof ApiError && err.status === 403) top = t("announcements.new.errorForbidden");
      else top = t("announcements.new.errorGeneric");
      if (!fields.sendAt) setScheduling(false);
      setErrors(fields);
      setTopError(top);
      setFocusTick((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  const describe = (id: string, field: string, help = false) => (errors[field] ? `${id}-erro` : help ? `${id}-ajuda` : undefined);
  const subtitle = unitName && daily ? t("announcements.new.subtitle", { unit: unitName, used: daily.unit.used, limit: daily.unit.limit }) : unitName ? t("announcements.new.subtitleUnit", { unit: unitName }) : t("announcements.new.intro");

  const targetBlock = <AnnouncementTargetPicker targets={targets} kind={kind} value={target} compact={narrow} onKind={chooseKind} onChange={setTarget} />;
  const typeBlock = (
    <>
      <TypeChips value={type} onChange={chooseType} select={narrow} hint={!narrow} error={errors.type} describedBy={describe("ann-type", "type")} />
      {pendingType && (
        <div role="alert" className="flex flex-col gap-2 rounded-card border bg-card p-4">
          <p>{t("announcements.new.typeChange", { type: t(`announcements.types.${pendingType}`) })}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="min-h-11" onClick={() => applyType(pendingType)}>
              {t("announcements.new.typeChangeYes")}
            </Button>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => setPendingType(undefined)}>
              {t("announcements.new.typeChangeNo")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
  const titleBlock = (
    <Field id="ann-title" label={t("announcements.new.titleField")} error={errors.title}>
      <Input id="ann-title" value={title} maxLength={120} aria-invalid={errors.title ? true : undefined} aria-describedby={describe("ann-title", "title")} onChange={(e) => setTitle(e.target.value)} />
    </Field>
  );
  const bodyBlock = (
    <Field id="ann-body" label={t("announcements.new.bodyField")} error={errors.body}>
      <BodyEditor id="ann-body" short={narrow} value={body} onChange={setBody} aria-invalid={errors.body ? true : undefined} aria-describedby={describe("ann-body", "body")} />
    </Field>
  );
  const imageBlock = (
    <Field id="ann-file" label={t("announcements.new.image")} error={errors.file}>
      <FileField id="ann-file" accept="image/*" label={t("announcements.new.imageChoose")} aria-describedby={describe("ann-file", "file")} onChange={(e) => void chooseImage(e.target.files?.[0])} />
      {uploading && <p role="status">{t("announcements.new.imageUploading")}</p>}
      {image && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <img src={image.url} alt={t("announcements.new.imageAlt")} className="max-h-24 rounded border" />
          <Button type="button" variant="outline" className="min-h-11" onClick={() => setImage(undefined)}>
            {t("announcements.new.imageRemove")}
          </Button>
        </div>
      )}
    </Field>
  );
  const channelsBlock = (
    <fieldset id="ann-channels" tabIndex={-1} className={narrow ? "flex flex-col gap-1" : "flex flex-wrap items-start gap-x-6 gap-y-1"} aria-describedby={describe("ann-channels", "channels")}>
      <legend className="mb-1 text-sm font-medium">{t("announcements.new.channels")}</legend>
      <ChannelRow checked disabled label={t("announcements.new.channelPortalShort")} hint={narrow ? undefined : t("announcements.new.channelPortalHint")} />
      <ChannelRow checked={email} onChange={setEmail} label={t("announcements.new.channelEmail")} />
      {!narrow && <ComingSoon variant="switch" label={t("announcements.new.channelPush")} />}
      {showWhatsapp && <ChannelRow checked={whatsapp} onChange={setWhatsapp} label={t(narrow ? "announcements.new.channelWhatsappMobile" : "announcements.new.channelWhatsapp")} hint={narrow ? undefined : t("announcements.new.channelWhatsappHint")} />}
      {errors.channels && (
        <p id="ann-channels-erro" className="text-sm text-danger-foreground">
          {errors.channels}
        </p>
      )}
    </fieldset>
  );
  const topErrorBlock = topError && (
    <p ref={topRef} tabIndex={-1} role="alert" className="rounded-md bg-danger px-4 py-3 text-sm text-danger-foreground">
      {topError}
    </p>
  );
  const scheduleDialog = scheduling && <ScheduleDialog busy={busy} error={errors.sendAt} onClose={() => setScheduling(false)} onConfirm={(at) => void submit(at)} />;
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit();
  };

  if (narrow) {
    const p = preview?.status === "ready" ? preview.data : null;
    return (
      <form id="ann-form" className="fixed inset-0 z-40 flex flex-col bg-[var(--background)]" onSubmit={onSubmit} noValidate>
        <header className="flex items-center gap-2 border-b border-divider bg-card px-2 py-2">
          <Button asChild variant="ghost" size="icon">
            <Link to="/comunicados" aria-label={t("announcements.new.back")}>
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
          <PageHeader compact title={t("announcements.new.title")} subtitle={unitName} className="min-w-0" />
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {targetBlock}
          {typeBlock}
          {titleBlock}
          {bodyBlock}
          {channelsBlock}
          {p && <SummaryBox label={t("announcements.new.summaryLabel")} items={[t("announcements.new.summaryLine", { count: p.recipients, email: p.email })]} />}
          {topErrorBlock}
        </div>
        <div className="flex gap-2 border-t border-divider bg-card p-3">
          <Button type="button" variant="secondary" className="min-h-11 flex-1" disabled={!targetPart || busy || uploading} onClick={() => setScheduling(true)}>
            <Clock aria-hidden />
            {t("announcements.new.scheduleShort")}
          </Button>
          <Button type="submit" className="min-h-11 flex-1" disabled={!targetPart || busy || uploading}>
            <Send aria-hidden />
            {busy ? t("announcements.new.sending") : t("announcements.new.sendShort")}
          </Button>
        </div>
        {scheduleDialog}
      </form>
    );
  }

  const scheduled = mode === "SCHEDULED";
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <PageHeader title={t("announcements.new.title")} subtitle={subtitle} />
      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4 rounded-card border bg-card p-6">
          {targetBlock}
          {typeBlock}
          {titleBlock}
          {bodyBlock}
          <div className="grid gap-4 md:grid-cols-2">
          {imageBlock}
          <Field id="ann-pinnedUntil" label={t("announcements.new.pinnedUntil")} error={errors.pinnedUntil}>
            <DateField id="ann-pinnedUntil" min={todayIso()} value={pinnedUntil} aria-invalid={errors.pinnedUntil ? true : undefined} aria-describedby={describe("ann-pinnedUntil", "pinnedUntil")} onChange={(e) => setPinnedUntil(e.target.value)} />
          </Field>
          </div>
          {channelsBlock}
          <fieldset className="flex flex-col gap-1">
            <legend className="text-sm font-medium">{t("announcements.new.when")}</legend>
            <div className="grid grid-cols-2 gap-2">
              <RadioCard name="ann-mode" checked={!scheduled} onChange={() => setMode("NOW")} label={t("announcements.new.now")} />
              <RadioCard name="ann-mode" checked={scheduled} onChange={() => setMode("SCHEDULED")} label={t("announcements.new.schedule")} description={t("announcements.new.scheduleHintRadio")} />
            </div>
            {scheduled && (
              <Field id="ann-sendAt" label={t("announcements.new.sendAt")} error={errors.sendAt}>
                <DateField id="ann-sendAt" type="datetime-local" value={sendAt} aria-invalid={errors.sendAt ? true : undefined} aria-describedby={describe("ann-sendAt", "sendAt")} onChange={(e) => setSendAt(e.target.value)} />
              </Field>
            )}
          </fieldset>
          {topErrorBlock}
        </div>
        <AnnouncementPreviewPanel
          state={preview}
          title={title}
          body={body}
          actions={
            <>
              <Button type="submit" className="min-h-11" disabled={!targetPart || busy || uploading || (scheduled && !sendAt)}>
                <Send aria-hidden />
                {busy ? t("announcements.new.sending") : t(scheduled ? "announcements.new.scheduleSend" : "announcements.new.send")}
              </Button>
              <ComingSoon variant="button" label={t("announcements.new.saveDraft")} />
            </>
          }
        />
      </div>
    </form>
  );
}

function Content() {
  const { t } = useTranslation();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ status: "loading" | "error" | "forbidden" } | { status: "ready"; data: AnnouncementTargets; templates: AnnouncementTemplates }>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    Promise.all([fetchTargets(), fetchTemplates()]).then(
      ([data, templates]) => alive && setState({ status: "ready", data, templates }),
      (e) => alive && setState({ status: e instanceof ApiError && e.status === 403 ? "forbidden" : "error" }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);

  const data = state.status === "ready" ? state.data : null;
  const templates = state.status === "ready" ? state.templates : null;
  const none = !!data && !data.organization && data.units.length === 0 && data.classes.length === 0 && data.modalities.length === 0;
  return (
    <div className="flex flex-col gap-4">
      {!(data && templates && !none) && (
        <Link to="/comunicados" className="inline-flex min-h-11 items-center self-start text-sm underline">
          {t("announcements.new.back")}
        </Link>
      )}
      {!(data && templates && !none) && <PageHeader title={t("announcements.new.title")} />}
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && <ErrorState onRetry={() => {
            setState({ status: "loading" });
            setTick((n) => n + 1);
          }} />}
      {state.status === "forbidden" && <ForbiddenState />}
      {none && <EmptyState title={t("announcements.new.emptyTitle")} text={t("announcements.new.emptyText")} />}
      {data && templates && !none && <Form targets={data} templates={templates} />}
    </div>
  );
}

// RF-COM-02: a barreira de dados é o servidor (403 vira "sem permissão" na própria tela).
export function NewAnnouncementPage() {
  return <Content />;
}
