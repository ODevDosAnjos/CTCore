import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useSearchParams } from "react-router";
import { ErrorState } from "@/components/states";
import { AuthShell } from "@/components/layout/AuthShell";
import { Lock } from "lucide-react";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import { safeNext } from "./safeNext";
import { useSession, type SessionView } from "./SessionProvider";
import { Turnstile } from "./Turnstile";
import { PasswordInput } from "./PasswordFields";
import { TwoFactorStep } from "./TwoFactorStep";

export function LoginPage() {
  const { t } = useTranslation();
  const { state, setSession } = useSession();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [show, setShow] = useState(false);
  const [ticket, setTicket] = useState<{ value: string; backupCodes?: number } | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // RN-ACE-10: o aviso sai e "Entrar" volta quando a trava acaba.
  useEffect(() => {
    if (lockedUntil === null) return;
    const id = setTimeout(() => setLockedUntil(null), Math.max(0, lockedUntil - Date.now()));
    return () => clearTimeout(id);
  }, [lockedUntil]);

  if (state.status === "ready") return <Navigate to={safeNext(params.get("next"))} replace />;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (sending) return;
    const next = {
      email: email.trim() ? undefined : t("auth.errors.emailRequired"),
      password: password ? undefined : t("auth.errors.passwordRequired"),
    };
    setErrors(next);
    setNotice(null);
    setLockedUntil(null);
    if (next.email || next.password) return;
    setFailed(false);
    setSending(true);
    try {
      const body = { email: email.trim(), password, ...(token ? { challengeToken: token } : {}) };
      const res = await api<SessionView | { twoFactorRequired: true; ticket: string; backupCodesRemaining?: number }>("/auth/login", { method: "POST", body });
      if ("twoFactorRequired" in res) {
        setTicket({ value: res.ticket, backupCodes: res.backupCodesRemaining });
        setPassword("");
      } else setSession(res);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const code = err instanceof ApiError ? err.code : "";
      if (code === "INVALID_CREDENTIALS") {
        setNotice(t("auth.errors.invalid"));
        setPassword("");
        passwordRef.current?.focus();
      } else if (status === 429) {
        const retryAt = err instanceof ApiError ? Date.parse(err.fields.find((f) => f.field === "retryAt")?.message ?? "") : NaN;
        if (retryAt > Date.now()) setLockedUntil(retryAt);
        else setNotice(t("auth.errors.tooMany"));
      } else if (code === "CHALLENGE_FAILED") {
        setNotice(t("auth.errors.challenge"));
        setResetKey((k) => k + 1);
      } else {
        setFailed(true);
      }
    } finally {
      setSending(false);
    }
  }

  if (ticket) {
    return (
      <TwoFactorStep
        ticket={ticket.value}
        backupCodesRemaining={ticket.backupCodes}
        onDone={setSession}
        onExpired={() => {
          setTicket(null);
          setNotice(t("twoFactor.login.expired"));
        }}
      />
    );
  }

  return (
    <AuthShell title={t("auth.title")} subtitle={t("auth.subtitle")}>
      {failed ? (
        <ErrorState onRetry={() => void submit()} />
      ) : (
        <form noValidate onSubmit={submit} className="space-y-4" aria-busy={sending}>
          {lockedUntil !== null && (
            <Banner tone="warn" icon={Lock}>
              {t("auth.errors.locked", { time: formatTime(lockedUntil) })}
            </Banner>
          )}
          {notice && <Banner tone="danger">{notice}</Banner>}
          <Field label={t("auth.email")} error={errors.email}>
            {(c) => <Input {...c} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label={t("auth.password")} error={errors.password}>
            {(c) => (
              <PasswordInput
                {...c}
                show={show}
                onToggle={() => setShow((s) => !s)}
                labels={{ show: t("auth.show"), hide: t("auth.hide") }}
                ref={passwordRef}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          <p className="text-right text-sm font-medium">
            <Link className="underline" to="/esqueci-senha">
              {t("auth.forgot")}
            </Link>
          </p>
          <Turnstile onToken={setToken} resetKey={resetKey} />
          <Button type="submit" size="lg" className="w-full" disabled={sending || lockedUntil !== null}>
            {sending ? t("auth.sending") : t("auth.submit")}
          </Button>
          {lockedUntil !== null && (
            <Button asChild variant="secondary" size="lg" className="w-full">
              <Link to="/esqueci-senha">{t("auth.createPassword")}</Link>
            </Button>
          )}
          {lockedUntil !== null && <p className="text-sm text-muted-foreground">{t("auth.lockedNote")}</p>}
        </form>
      )}
    </AuthShell>
  );
}
