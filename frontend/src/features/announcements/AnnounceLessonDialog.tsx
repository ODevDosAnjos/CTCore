import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Modal } from "@/components/Modal";
import { ErrorState, ForbiddenState, LoadingState } from "@/components/states";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ComingSoon } from "@/components/ui/coming-soon";
import { DateField } from "@/components/ui/date-field";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SummaryBox } from "@/components/ui/summary-box";
import { br, weekday } from "@/features/agenda/agendaDates";
import { ApiError } from "@/lib/api";
import { templateFor } from "./announcementTemplates";
import {
  ANNOUNCEMENT_TYPES,
  type AnnouncementChannel,
  type AnnouncementDraft,
  type AnnouncementPreview,
  type AnnouncementTemplates,
  type AnnouncementType,
} from "./types";
import {
  createAnnouncement,
  fetchTemplates,
  previewAnnouncement,
} from "./useAnnouncements";

/** O que a aula pede: destino fixo (turma ou unidade) e os dados que preenchem o modelo. */
export interface LessonNotice {
  target:
    | { kind: "CLASS"; classId: string; name: string; hasGroup: boolean }
    | { kind: "UNIT"; unitId: string; name: string };
  /** AAAA-MM-DD e HH:MM da aula. */
  date: string;
  time: string;
  cancelled: boolean;
  type: AnnouncementType;
}

// Só http e https viram link (como a página cheia).
function safeLink(link: string | null | undefined) {
  if (!link) return null;
  try {
    const u = new URL(link);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

// RF-COM-02 em janela, aberta a partir da aula (A3, D6). O servidor reconfere destino, limite diário e permissão; a página /comunicados/novo segue para os outros usos.
export function AnnounceLessonDialog({
  notice,
  onClose,
}: {
  notice: LessonNotice | null;
  onClose: () => void;
}) {
  if (!notice) return null;
  return <Body notice={notice} onClose={onClose} />;
}

function Body({
  notice,
  onClose,
}: {
  notice: LessonNotice;
  onClose: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<
    | { status: "loading" | "error" | "forbidden" }
    | { status: "ready"; templates: AnnouncementTemplates }
  >({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetchTemplates().then(
      (templates) => alive && setState({ status: "ready", templates }),
      (e) =>
        alive &&
        setState({
          status:
            e instanceof ApiError && e.status === 403 ? "forbidden" : "error",
        }),
    );
    return () => {
      alive = false;
    };
  }, [tick]);
  return (
    <Form
      notice={notice}
      state={state}
      onRetry={() => {
        setState({ status: "loading" });
        setTick((n) => n + 1);
      }}
      onClose={onClose}
    />
  );
}

function Shell({
  notice,
  onClose,
  busy,
  footer,
  children,
}: {
  notice: LessonNotice;
  onClose: () => void;
  busy?: boolean;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const day = t(`agenda.weekdaysLong.${weekday(notice.date)}`).split("-")[0];
  const date = br(notice.date).slice(0, 5);
  return (
    <Modal
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      size="md"
      fullOnMobile
      title={t("announcements.lesson.title")}
      footer={footer}
    >
      <p className="mb-4 text-sm text-muted-foreground">
        {t(
          notice.cancelled
            ? "announcements.lesson.subtitleCancelled"
            : "announcements.lesson.subtitle",
          { day, date },
        )}
      </p>
      {children}
    </Modal>
  );
}

type Loaded =
  | { status: "loading" | "error" | "forbidden" }
  | { status: "ready"; templates: AnnouncementTemplates };

function Form({
  notice,
  state,
  onRetry,
  onClose,
}: {
  notice: LessonNotice;
  state: Loaded;
  onRetry: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { target } = notice;
  const vars = {
    turma: target.name,
    data: br(notice.date),
    horario: notice.time,
  };
  const templates = state.status === "ready" ? state.templates : null;
  const [type, setType] = useState<AnnouncementType>(notice.type);
  // O texto vem do modelo do tipo; o que a pessoa digita fica em edits e vale até trocar o tipo.
  const [edits, setEdits] = useState<{ title?: string; body?: string }>({});
  const base = templates
    ? templateFor(t, templates, type, vars)
    : { title: "", body: "" };
  const title = edits.title ?? base.title;
  const body = edits.body ?? base.body;
  const [pendingType, setPendingType] = useState<AnnouncementType>();
  const [email, setEmail] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [sendAt, setSendAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [topError, setTopError] = useState("");
  const [previewed, setPreviewed] = useState<{
    key: string;
    value: AnnouncementPreview | "error";
  }>();

  const channels: AnnouncementChannel[] = [
    "PORTAL",
    ...(email ? (["EMAIL"] as const) : []),
    ...(whatsapp ? (["WHATSAPP"] as const) : []),
  ];
  const channelsKey = channels.join(",");
  const targetPart =
    target.kind === "CLASS"
      ? ({ targetKind: "CLASS", classId: target.classId } as const)
      : ({ targetKind: "UNIT", unitId: target.unitId } as const);
  const targetKey = target.kind === "CLASS" ? target.classId : target.unitId;

  const previewKey = `${targetKey}|${channelsKey}`;
  const preview = previewed?.key === previewKey ? previewed.value : "loading";
  useEffect(() => {
    let alive = true;
    previewAnnouncement({
      ...targetPart,
      channels: channelsKey.split(",") as AnnouncementChannel[],
    }).then(
      (data) => alive && setPreviewed({ key: previewKey, value: data }),
      () => alive && setPreviewed({ key: previewKey, value: "error" }),
    );
    return () => {
      alive = false;
    };
  }, [previewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyType(next: AnnouncementType) {
    setType(next);
    setEdits({});
    setPendingType(undefined);
  }
  function chooseType(next: AnnouncementType) {
    if (next === type) return;
    if (title !== base.title || body !== base.body) setPendingType(next);
    else applyType(next);
  }

  async function submit(later: boolean) {
    if (busy) return;
    if (later && !sendAt) return;
    setBusy(true);
    setErrors({});
    setTopError("");
    const draft: AnnouncementDraft = {
      ...targetPart,
      type,
      title,
      body,
      channels,
      ...(later ? { sendAt: new Date(sendAt).toISOString() } : {}),
    };
    try {
      const created = await createAnnouncement(draft);
      const group =
        typeof preview === "object" &&
        whatsapp &&
        preview.whatsapp?.mode === "GROUP"
          ? safeLink(preview.whatsapp.groupLink)
          : null;
      onClose();
      navigate("/comunicados", {
        state: { sent: { status: created.status, groupLink: group } },
      });
    } catch (err) {
      const fields: Record<string, string> = {};
      let top = "";
      if (err instanceof ApiError && err.status === 400) {
        for (const f of err.fields) {
          if (["type", "title", "body", "channels", "sendAt"].includes(f.field))
            fields[f.field] = t(`announcements.new.fields.${f.field}`);
          else top = t("announcements.new.fields.other");
        }
        if (!err.fields.length) top = t("announcements.new.fields.other");
      } else if (
        err instanceof ApiError &&
        err.code === "ANNOUNCEMENT_DAILY_LIMIT"
      )
        top = t("announcements.new.errorLimit");
      else if (err instanceof ApiError && err.status === 403)
        top = t("announcements.new.errorForbidden");
      else top = t("announcements.new.errorGeneric");
      setErrors(fields);
      setTopError(top);
    } finally {
      setBusy(false);
    }
  }

  const ready = typeof preview === "object";
  const summary = ready
    ? [
        t("announcements.lesson.summary", {
          count: preview.recipients,
          portal: preview.portal,
          email: preview.email,
        }),
        ...(notice.cancelled ? [t("announcements.lesson.cancelledNote")] : []),
      ]
    : [];
  const footer = templates && (
    <>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={onClose}
        disabled={busy}
      >
        {t("announcements.lesson.cancel")}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={busy || (scheduling && !sendAt)}
        onClick={() => (scheduling ? void submit(true) : setScheduling(true))}
      >
        {t(
          scheduling
            ? "announcements.lesson.confirmSchedule"
            : "announcements.lesson.schedule",
        )}
      </Button>
      <Button
        type="button"
        className="min-h-11"
        disabled={busy}
        onClick={() => void submit(false)}
      >
        {busy
          ? t("announcements.lesson.sending")
          : t("announcements.lesson.sendNow")}
      </Button>
    </>
  );
  return (
    <Shell notice={notice} onClose={onClose} busy={busy} footer={footer}>
      {state.status === "loading" && <LoadingState />}
      {state.status === "forbidden" && <ForbiddenState />}
      {state.status === "error" && <ErrorState onRetry={onRetry} />}
      {templates && (
        <form
          id="announce-lesson"
          noValidate
          className="flex flex-col gap-4"
          aria-busy={busy}
          onSubmit={(e) => {
            e.preventDefault();
            void submit(scheduling);
          }}
        >
          <Field label={t("announcements.lesson.destination")}>
            {(c) => (
              <Input
                {...c}
                className="min-h-11"
                readOnly
                value={t(
                  target.kind === "CLASS"
                    ? "announcements.lesson.destClass"
                    : "announcements.lesson.destUnit",
                  { name: target.name },
                )}
              />
            )}
          </Field>
          <Field label={t("announcements.new.type")} error={errors.type}>
            {(c) => (
              <Select
                {...c}
                className="min-h-11"
                value={type}
                onChange={(e) => chooseType(e.target.value as AnnouncementType)}
              >
                {ANNOUNCEMENT_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {t(`announcements.types.${v}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          {pendingType && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-card border bg-card p-4"
            >
              <p>
                {t("announcements.new.typeChange", {
                  type: t(`announcements.types.${pendingType}`),
                })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={() => applyType(pendingType)}
                >
                  {t("announcements.new.typeChangeYes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => setPendingType(undefined)}
                >
                  {t("announcements.new.typeChangeNo")}
                </Button>
              </div>
            </div>
          )}
          <Field label={t("announcements.new.titleField")} error={errors.title}>
            {(c) => (
              <Input
                {...c}
                className="min-h-11"
                value={title}
                maxLength={120}
                onChange={(e) =>
                  setEdits((x) => ({ ...x, title: e.target.value }))
                }
              />
            )}
          </Field>
          <Field label={t("announcements.new.bodyField")} error={errors.body}>
            {(c) => (
              <>
                <Textarea
                  {...c}
                  rows={6}
                  value={body}
                  onChange={(e) =>
                    setEdits((x) => ({
                      ...x,
                      body: e.target.value.slice(0, 2000),
                    }))
                  }
                />
                <p className="text-right text-xs text-muted-foreground">
                  {t("announcements.lesson.counter", { count: body.length })}
                </p>
              </>
            )}
          </Field>
          <fieldset className="flex flex-col">
            <legend className="mb-1 text-sm font-medium">
              {t("announcements.new.channels")}
            </legend>
            <div className="flex flex-wrap gap-x-4">
              <Checkbox
                label={t("announcements.new.channelPortal")}
                checked
                disabled
                readOnly
              />
              <Checkbox
                label={t("announcements.new.channelEmail")}
                checked={email}
                onChange={(e) => setEmail(e.target.checked)}
              />
              {target.kind === "CLASS" && target.hasGroup && (
                <Checkbox
                  label={t("announcements.lesson.whatsapp")}
                  checked={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.checked)}
                />
              )}
              <ComingSoon
                variant="switch"
                label={t("announcements.new.channelPush")}
              />
            </div>
            {errors.channels && (
              <p className="text-xs text-danger-foreground">
                {errors.channels}
              </p>
            )}
          </fieldset>
          {scheduling && (
            <Field label={t("announcements.new.sendAt")} error={errors.sendAt}>
              {(c) => (
                <DateField
                  {...c}
                  type="datetime-local"
                  className="min-h-11"
                  value={sendAt}
                  onChange={(e) => setSendAt(e.target.value)}
                />
              )}
            </Field>
          )}
          {preview === "loading" && (
            <p role="status" className="text-sm">
              {t("announcements.new.previewLoading")}
            </p>
          )}
          {preview === "error" && (
            <p role="status" className="text-sm text-danger-foreground">
              {t("announcements.new.previewError")}
            </p>
          )}
          {ready && (
            <SummaryBox
              label={t("announcements.lesson.summaryLabel")}
              items={summary}
            />
          )}
          {topError && <Banner tone="danger">{topError}</Banner>}
        </form>
      )}
    </Shell>
  );
}
