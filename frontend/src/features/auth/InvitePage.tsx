import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ErrorState, LoadingState } from "@/components/states";
import { AuthShell } from "@/components/layout/AuthShell";
import { Banner } from "@/components/ui/banner";
import { Users } from "lucide-react";
import { Link } from "react-router";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { PasswordFields, PasswordInput } from "./PasswordFields";
import { isStrongPassword } from "./PasswordRules";
import { useSession, type SessionView } from "./SessionProvider";

interface InviteInfo {
  email: string;
  name?: string | null;
  expiresAt: string;
  existingAccount: boolean;
  role: string;
  organizationName: string;
  invitedByName?: string | null;
  unitNames: string[];
}

type Load = { status: "loading" } | { status: "error" } | { status: "invalid" } | { status: "ready"; info: InviteInfo };

// RF-ACE-02: o código vive só no caminho da URL; a senha só no estado do formulário (R11).
export function InvitePage() {
  const { t } = useTranslation();
  const { code = "" } = useParams();
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    api<InviteInfo>(`/auth/invitations/${encodeURIComponent(code)}`)
      .then((info) => alive && setLoad({ status: "ready", info }))
      .catch((err) => {
        if (!alive) return;
        setLoad(err instanceof ApiError && err.status === 410 ? { status: "invalid" } : { status: "error" });
      });
    return () => {
      alive = false;
    };
  }, [code, attempt]);

  const existing = load.status === "ready" && load.info.existingAccount;
  const valid = existing ? password !== "" : isStrongPassword(password) && password === confirm;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (sending || !valid) return;
    setFailed(false);
    setNotice(null);
    setFieldError(null);
    setSending(true);
    try {
      setSession(await api<SessionView>(`/auth/invitations/${encodeURIComponent(code)}/accept`, { method: "POST", body: { password } }));
      navigate("/", { replace: true });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const errCode = err instanceof ApiError ? err.code : "";
      if (status === 410) {
        setLoad({ status: "invalid" });
      } else if (errCode === "PASSWORD_LEAKED" || errCode === "PASSWORD_WEAK") {
        setFieldError(t(errCode === "PASSWORD_LEAKED" ? "password.leaked" : "password.weak"));
        passwordRef.current?.focus();
      } else if (errCode === "INVALID_CREDENTIALS") {
        setNotice(t("auth.errors.invalid"));
        setPassword("");
        currentRef.current?.focus();
      } else if (status === 429) {
        setNotice(t("auth.errors.tooMany"));
      } else {
        setFailed(true);
      }
    } finally {
      setSending(false);
    }
  }

  if (load.status === "loading") {
    return (
      <AuthShell title={t("invite.title")}>
        <LoadingState />
      </AuthShell>
    );
  }
  if (load.status === "error") {
    return (
      <AuthShell title={t("invite.title")}>
        <ErrorState
          onRetry={() => {
            setLoad({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
        />
      </AuthShell>
    );
  }
  if (load.status === "invalid") {
    // RN-ACE-10: vencido, usado ou inexistente têm a mesma tela, sem revelar a organização.
    return (
      <AuthShell title={t("invite.invalid.title")} subtitle={t("invite.invalid.text")} focusTitle>
        <p className="text-sm">{t("invite.invalid.help")}</p>
        <Link to="/entrar" className={buttonVariants({ size: "lg", className: "w-full" })}>
          {t("invite.invalid.login")}
        </Link>
      </AuthShell>
    );
  }
  const { info } = load;
  const title = t(existing ? "invite.titleExisting" : "invite.title");
  const units = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" }).format(info.unitNames);
  const cardDetail = [
    info.unitNames.length > 0 && t("invite.card.units", { count: info.unitNames.length, list: units }),
    info.invitedByName && t("invite.card.invitedBy", { name: info.invitedByName }),
    existing && t("invite.card.validUntil", { date: formatDate(info.expiresAt) }),
  ]
    .filter(Boolean)
    .join(" · ");
  if (failed) {
    return (
      <AuthShell title={title}>
        <ErrorState onRetry={() => void submit()} />
      </AuthShell>
    );
  }
  const subtitle = existing
    ? t("invite.subtitleExisting")
    : t("invite.subtitle", { organization: info.organizationName, date: formatDate(info.expiresAt) });
  return (
    <AuthShell title={title} subtitle={subtitle}>
      <form noValidate onSubmit={submit} className="space-y-4" aria-busy={sending}>
        <div className="flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm">
          <Users aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">{t("invite.card.role", { role: t(`chooseLink.roles.${info.role}`), organization: info.organizationName })}</p>
            {cardDetail && <p className="text-muted-foreground">{cardDetail}</p>}
          </div>
        </div>
        {!existing && info.name && <Field label={t("invite.name")}>{(c) => <Input {...c} readOnly className="bg-muted" value={info.name ?? ""} />}</Field>}
        <Field label={t("invite.email")}>{(c) => <Input {...c} type="email" readOnly className="bg-muted" autoComplete="username" value={info.email} />}</Field>
        {notice && <Banner tone="danger">{notice}</Banner>}
        {existing ? (
          <Field label={t("invite.currentPassword")}>
            {(c) => (
              <PasswordInput
                {...c}
                show={showCurrent}
                onToggle={() => setShowCurrent((s) => !s)}
                labels={{ show: t("password.show"), hide: t("password.hide") }}
                ref={currentRef}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
        ) : (
          <PasswordFields
            password={password}
            confirm={confirm}
            onPassword={setPassword}
            onConfirm={setConfirm}
            error={fieldError}
            inputRef={passwordRef}
            idPrefix="invite"
            labels={{ password: t("invite.password"), confirm: t("invite.confirm") }}
          />
        )}
        <Button type="submit" size="lg" className="w-full" disabled={sending || !valid}>
          {sending ? t("invite.sending") : t(existing ? "invite.submitExisting" : "invite.submit")}
        </Button>
        {existing && (
          <p className="text-center text-sm">
            <Link className="underline" to="/esqueci-senha">
              {t("auth.forgot")}
            </Link>
          </p>
        )}
        {existing && <p className="text-sm text-muted-foreground">{t("invite.existingNote")}</p>}
      </form>
    </AuthShell>
  );
}
