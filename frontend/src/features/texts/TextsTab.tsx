import { Clock, Undo2 } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState, ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { useTexts, type TextModel } from "./useTexts";

// Ordem do canvas: boas-vindas, lembretes, comunicados.
const ORDER = ["WELCOME", "REMINDER_BEFORE", "REMINDER_DUE", "REMINDER_OVERDUE", "ANNOUNCEMENT_CANCELED_CLASS", "ANNOUNCEMENT_TEACHER_CHANGE", "ANNOUNCEMENT_SCHEDULE_CHANGE", "ANNOUNCEMENT_NO_CLASS_DAY", "ANNOUNCEMENT_GENERAL"];
const day = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(iso)) : "");
const hour = (iso: string | null) => (iso ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso)).replace(":", "h") : "");

type Field = "subject" | "body";
type Api = ReturnType<typeof useTexts>;

function Editor({ model, canManage, api }: { model: TextModel; canManage: boolean; api: Api }) {
  const { t } = useTranslation();
  const inUse = model.custom ?? model.platform;
  const [subject, setSubject] = useState(inUse.subject);
  const [body, setBody] = useState(inUse.body);
  const [errors, setErrors] = useState<Partial<Record<Field | "top", string>>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const last = useRef<Field>("body");
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fieldEl = (f: Field) => (f === "subject" ? subjectRef : bodyRef).current;
  const name = t(`texts.models.${model.key}`);

  const changed = (subject.trim() !== inUse.subject.trim() || body.trim() !== inUse.body.trim()) && subject.trim() !== "" && body.trim() !== "";
  const sample = (f: string) => t(`texts.sample.${f}`);
  const fill = (text: string) => text.replace(/\{([a-z_]+)\}/g, (all, f: string) => (model.fields.includes(f) ? sample(f) : all));

  function insert(field: string) {
    const target = last.current;
    const el = fieldEl(target);
    const text = `{${field}}`;
    const set = target === "subject" ? setSubject : setBody;
    const value = target === "subject" ? subject : body;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    set(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  }

  async function save() {
    setBusy(true);
    setErrors({});
    setMessage("");
    try {
      await api.save(model.key, { subject: subject.trim(), body: body.trim() });
      setMessage(t("texts.saved"));
    } catch (e) {
      const next: Partial<Record<Field | "top", string>> = {};
      if (e instanceof ApiError && e.status === 400) {
        for (const f of e.fields) {
          if (f.field === "subject" || f.field === "body") next[f.field] = t(f.message.startsWith("igual") ? "texts.errors.same" : `texts.errors.${f.field}`);
        }
      }
      if (!next.subject && !next.body) next.top = t("texts.errors.generic");
      setErrors(next);
      const first: Field | undefined = next.subject ? "subject" : next.body ? "body" : undefined;
      if (first) fieldEl(first)?.focus();
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    try {
      await api.reset(model.key);
    } catch {
      setErrors({ top: t("texts.errors.resetGeneric") });
      throw new Error("reset");
    }
    setSubject(model.platform.subject);
    setBody(model.platform.body);
    setErrors({});
    setMessage(t("texts.resetDone"));
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canManage && changed && !busy) void save();
        }}
      >
        <section aria-labelledby="texts-editor-title" className="flex flex-col gap-3 rounded-card border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="texts-editor-title" className="text-base font-semibold">
              {t("texts.editor.title", { name })}
            </h2>
            {model.custom && (
              <Button type="button" variant="ghost" size="sm" className="min-h-11" disabled={!canManage || busy} onClick={() => setConfirming(true)}>
                <Undo2 aria-hidden className="size-4" />
                {t("texts.reset")}
              </Button>
            )}
          </div>
          {model.key === "WELCOME" && <p className="text-sm text-muted-foreground">{t("texts.welcomeNote")}</p>}
          {!canManage && <p className="text-sm text-muted-foreground">{t("texts.editor.readOnly")}</p>}
          {message && <p role="status" className="text-sm">{message}</p>}
          {errors.top && <Banner tone="danger">{errors.top}</Banner>}
          <div>
            <label htmlFor="texts-subject" className="text-xs font-medium text-muted-foreground">
              {t("texts.editor.subject")}
            </label>
            <Input
              id="texts-subject"
              ref={subjectRef}
              value={subject}
              disabled={!canManage}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? "texts-subject-erro" : undefined}
              onFocus={() => (last.current = "subject")}
              onChange={(e) => setSubject(e.target.value)}
            />
            {errors.subject && (
              <p id="texts-subject-erro" className="text-sm text-danger-foreground">
                {errors.subject}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="texts-body" className="text-xs font-medium text-muted-foreground">
              {t("texts.editor.body")}
            </label>
            <Textarea
              id="texts-body"
              ref={bodyRef}
              className="min-h-40"
              value={body}
              disabled={!canManage}
              aria-invalid={!!errors.body}
              aria-describedby={errors.body ? "texts-body-erro" : undefined}
              onFocus={() => (last.current = "body")}
              onChange={(e) => setBody(e.target.value)}
            />
            {errors.body && (
              <p id="texts-body-erro" className="text-sm text-danger-foreground">
                {errors.body}
              </p>
            )}
          </div>
          <fieldset className="flex flex-wrap items-center gap-2" disabled={!canManage} aria-label={t("texts.editor.fields")}>
            <span aria-hidden="true" className="text-xs text-muted-foreground">
              {t("texts.editor.fields")}
            </span>
            {model.fields.map((f) => (
              <Button key={f} type="button" variant="outline" size="sm" className="min-h-11 rounded-full text-xs" aria-label={t("texts.editor.insert", { field: t(`texts.fieldLabels.${f}`) })} onClick={() => insert(f)}>
                {`{${f}}`}
              </Button>
            ))}
          </fieldset>
          {model.fields.includes("link_pagamento") && <p className="text-sm text-muted-foreground">{t("texts.editor.linkNote")}</p>}
        </section>
        <section aria-labelledby="texts-preview-title" className="flex flex-col gap-2 rounded-card border bg-muted p-4">
          <h3 id="texts-preview-title" className="text-base font-semibold">
            {t("texts.preview.title")}
          </h3>
          <p className="break-words text-sm text-muted-foreground">{t("texts.preview.subject", { subject: fill(subject) })}</p>
          <p className="whitespace-pre-wrap break-words">{fill(body)}</p>
          <p className="text-sm text-muted-foreground">{t("texts.preview.footer")}</p>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            {model.custom && (
              <>
                <Clock aria-hidden className="size-3.5 shrink-0" />
                {t("texts.editor.updated", { date: day(model.updatedAt), time: hour(model.updatedAt), by: model.updatedBy ?? "" })}
              </>
            )}
          </p>
          <Button type="submit" className="min-h-11" disabled={!canManage || busy || !changed}>
            {t("texts.save")}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("texts.resetConfirm.title")}
        summary={t("texts.resetConfirm.summary", { name })}
        confirmLabel={t("texts.resetConfirm.confirm")}
        onConfirm={reset}
      />
    </div>
  );
}

// RF-COM-03: Coordenador edita; Administrador só consulta (canManage). A barreira de dados é o servidor.
export function TextsTab() {
  const { t } = useTranslation();
  const api = useTexts();
  const [key, setKey] = useState<string>();
  if (api.status === "loading") return <LoadingState />;
  if (api.status === "forbidden") return <ForbiddenState />;
  if (!api.data) return <ErrorState onRetry={api.retry} />;

  const { canManage, models } = api.data;
  const ordered = ORDER.map((k) => models.find((m) => m.key === k)).filter((m): m is TextModel => !!m);
  const selected = ordered.find((m) => m.key === key) ?? ordered[0];
  return (
    <div className="flex flex-col gap-4">
      {ordered.length === 0 && <EmptyState title={t("texts.emptyTitle")} text={t("texts.emptyText")} />}
      {selected && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <nav aria-label={t("texts.list")}>
            <ul className="flex flex-col divide-y rounded-card border bg-card p-2">
              {ordered.map((m) => (
                <li key={m.key}>
                  <button
                    type="button"
                    aria-current={m.key === selected.key ? "true" : undefined}
                    className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-acc focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:bg-acc aria-[current=true]:font-semibold"
                    onClick={() => setKey(m.key)}
                  >
                    <span className="break-words">{t(`texts.models.${m.key}`)}</span>
                    {m.custom ? <Badge tone="info">{t("texts.origin.custom")}</Badge> : <span className="text-xs text-muted-foreground">{t("texts.origin.platform")}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <Editor key={selected.key} model={selected} canManage={canManage} api={api} />
        </div>
      )}
    </div>
  );
}
