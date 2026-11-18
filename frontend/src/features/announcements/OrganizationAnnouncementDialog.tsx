import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Modal } from "@/components/Modal";
import { ErrorState, LoadingState } from "@/components/states";
import { Clock, Send } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { ChoiceCards } from "@/components/ui/choice-cards";
import { Field, Input } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { ApiError } from "@/lib/api";
import { BodyEditor } from "./BodyEditor";
import { ScheduleDialog } from "./ScheduleDialog";
import { TypeChips } from "./TypeChips";
import { templateFor } from "./announcementTemplates";
import type { AnnouncementCreated, AnnouncementDailyLimit, AnnouncementDraft, AnnouncementPreview, AnnouncementTargets, AnnouncementTemplates, AnnouncementType } from "./types";
import { createAnnouncement, fetchDailyLimit, fetchTargets, fetchTemplates, previewAnnouncement } from "./useAnnouncements";

type Loaded = { targets: AnnouncementTargets; templates: AnnouncementTemplates; limit: AnnouncementDailyLimit | null; preview: AnnouncementPreview | null };
type Other = "UNIT" | "MODALITY" | "CLASS";
const KINDS = ["ORGANIZATION", "UNIT", "MODALITY", "CLASS"] as const;

// RN-COM-01, RN-COM-07: comunicado para a organização inteira (só o Coordenador), com o limite próprio dela.
// Quem não é Coordenador (o servidor não libera "organização" nos destinos) não vê a janela.
export function OrganizationAnnouncementDialog({ unitId, onClose, onSent }: { unitId?: string; onClose: () => void; onSent: (created: AnnouncementCreated) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<{ status: "loading" | "error" } | { status: "ready"; data: Loaded }>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    (async (): Promise<Loaded> => {
      const [targets, templates] = await Promise.all([fetchTargets(), fetchTemplates()]);
      if (!targets.organization) return { targets, templates, limit: null, preview: null };
      const unit = unitId ?? targets.units[0]?.id;
      // A contagem e a prévia só alimentam o Resumo: se falharem, a janela segue e o servidor confere ao enviar.
      const [limit, preview] = await Promise.all([unit ? fetchDailyLimit(unit).catch(() => null) : null, previewAnnouncement({ targetKind: "ORGANIZATION", channels: ["PORTAL", "EMAIL"] }).catch(() => null)]);
      return { targets, templates, limit, preview };
    })().then(
      (data) => alive && setState({ status: "ready", data }),
      () => alive && setState({ status: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [unitId, tick]);

  const data = state.status === "ready" ? state.data : null;
  const allowed = !data || data.targets.organization;
  useEffect(() => {
    if (!allowed) onClose();
  }, [allowed]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!allowed) return null;
  if (data)
    return (
      <Body
        data={data}
        onClose={onClose}
        onSent={onSent}
        onOther={(k) => {
          onClose();
          navigate(`/comunicados/novo?kind=${k}`);
        }}
      />
    );
  return (
    <Modal open size="md"
      scrim="canvas" title={t("announcements.new.org.title")} onOpenChange={(o) => !o && onClose()}>
      {state.status === "loading" && <LoadingState />}
      {state.status === "error" && (
        <ErrorState
          onRetry={() => {
            setState({ status: "loading" });
            setTick((n) => n + 1);
          }}
        />
      )}
    </Modal>
  );
}

function Body({ data, onClose, onSent, onOther }: { data: Loaded; onClose: () => void; onSent: (c: AnnouncementCreated) => void; onOther: (k: Other) => void }) {
  const { t } = useTranslation();
  const [type, setType] = useState<AnnouncementType>("GENERAL");
  const [applied, setApplied] = useState(() => templateFor(t, data.templates, "GENERAL", {}));
  const [title, setTitle] = useState(applied.title);
  const [body, setBody] = useState(applied.body);
  const [pending, setPending] = useState<AnnouncementType>();
  const [scheduling, setScheduling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [top, setTop] = useState("");

  const org = data.limit?.organization ?? null;
  const full = !!org && org.used >= org.limit;
  const p = data.preview;

  function apply(next: AnnouncementType) {
    const text = templateFor(t, data.templates, next, {});
    setType(next);
    setTitle(text.title);
    setBody(text.body);
    setApplied(text);
    setPending(undefined);
  }
  function choose(next: AnnouncementType) {
    if (next === type) return;
    if (title !== applied.title || body !== applied.body) setPending(next);
    else apply(next);
  }

  async function send(sendAt?: string) {
    if (busy || full) return;
    setBusy(true);
    setErrors({});
    setTop("");
    const draft: AnnouncementDraft = { targetKind: "ORGANIZATION", type, title, body, channels: ["PORTAL", "EMAIL"], ...(sendAt ? { sendAt } : {}) };
    try {
      onSent(await createAnnouncement(draft));
    } catch (err) {
      const fields: Record<string, string> = {};
      let message = "";
      if (err instanceof ApiError && err.status === 400) {
        for (const f of err.fields) {
          if (["type", "title", "body", "sendAt"].includes(f.field)) fields[f.field] = t(`announcements.new.fields.${f.field}`);
          else message = t("announcements.new.fields.other");
        }
        if (!err.fields.length) message = t("announcements.new.fields.other");
      } else if (err instanceof ApiError && err.code === "ANNOUNCEMENT_DAILY_LIMIT") message = t("announcements.new.org.limitFull", { limit: org?.limit ?? 20 });
      else if (err instanceof ApiError && err.status === 403) message = t("announcements.new.errorForbidden");
      else message = t("announcements.new.errorGeneric");
      if (!fields.sendAt) setScheduling(false);
      setErrors(fields);
      setTop(message);
    } finally {
      setBusy(false);
    }
  }

  const summary = p ? [t("announcements.new.org.summary", { count: p.recipients, units: data.targets.units.length === 2 ? t("announcements.new.org.two") : data.targets.units.length, email: p.email })] : [];
  if (org) summary.push(t("announcements.new.org.limit", { used: org.used, limit: org.limit }));
  const off = busy || full || !title.trim() || !body.trim();
  return (
    <Modal
      open
      size="md"
      scrim="canvas"
      title={t("announcements.new.org.title")}
      onOpenChange={(o) => !o && !busy && onClose()}
      footer={
        <>
          <Button type="button" variant="ghost" className="min-h-11" onClick={onClose}>
            {t("announcements.new.org.cancel")}
          </Button>
          <Button type="button" variant="secondary" className="min-h-11" disabled={off} onClick={() => setScheduling(true)}>
            <Clock aria-hidden />
            {t("announcements.new.org.schedule")}
          </Button>
          <Button type="submit" form="org-announcement" className="min-h-11" disabled={off}>
            <Send aria-hidden />
            {t("announcements.new.org.send")}
          </Button>
        </>
      }
    >
      <form
        id="org-announcement"
        className="flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <ChoiceCards
          legend={t("announcements.new.target")}
          value="ORGANIZATION"
          onChange={(k) => k !== "ORGANIZATION" && onOther(k as Other)}
          options={KINDS.map((k) => ({ value: k, label: t(`announcements.new.org.options.${k}`), description: k === "ORGANIZATION" ? t("announcements.new.org.hint") : undefined }))}
        />
        <TypeChips value={type} onChange={choose} select error={errors.type} />
        {pending && (
          <div role="alert" className="flex flex-col gap-2 rounded-card border bg-card p-4">
            <p>{t("announcements.new.typeChange", { type: t(`announcements.types.${pending}`) })}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" className="min-h-11" onClick={() => apply(pending)}>
                {t("announcements.new.typeChangeYes")}
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setPending(undefined)}>
                {t("announcements.new.typeChangeNo")}
              </Button>
            </div>
          </div>
        )}
        <Field label={t("announcements.new.titleField")} error={errors.title}>
          {(c) => <Input {...c} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />}
        </Field>
        <Field label={t("announcements.new.bodyField")} error={errors.body}>
          {(c) => <BodyEditor {...c} short value={body} onChange={setBody} />}
        </Field>
        {summary.length > 0 && <SummaryBox label={t("announcements.new.summaryLabel")} items={summary} />}
        {full && <Banner tone="warn">{t("announcements.new.org.limitFull", { limit: org!.limit })}</Banner>}
        {top && <Banner tone="danger">{top}</Banner>}
      </form>
      {scheduling && <ScheduleDialog busy={busy} error={errors.sendAt} onClose={() => setScheduling(false)} onConfirm={(at) => void send(at)} />}
    </Modal>
  );
}
