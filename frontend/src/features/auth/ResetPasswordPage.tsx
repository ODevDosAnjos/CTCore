import { useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ErrorState } from "@/components/states";
import { AuthShell } from "@/components/layout/AuthShell";
import { Button } from "@/components/ui/button";
import { ApiError, api } from "@/lib/api";
import { ResetLinkRequest } from "./ForgotPasswordPage";
import { PasswordFields } from "./PasswordFields";
import { isStrongPassword } from "./PasswordRules";
import { useSession, type SessionView } from "./SessionProvider";

// RF-ACE-03: o código vive só no caminho da URL; a senha só no estado do formulário (R11).
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const { code = "" } = useParams();
  const { setSession } = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const valid = isStrongPassword(password) && password === confirm;

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (sending || !valid) return;
    setFailed(false);
    setFieldError(null);
    setSending(true);
    try {
      setSession(await api<SessionView>(`/auth/password-reset/${encodeURIComponent(code)}`, { method: "POST", body: { password } }));
      navigate("/", { replace: true });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const errCode = err instanceof ApiError ? err.code : "";
      if (status === 410) {
        setInvalid(true);
      } else if (errCode === "PASSWORD_LEAKED" || errCode === "PASSWORD_WEAK") {
        setFieldError(t(errCode === "PASSWORD_LEAKED" ? "password.leaked" : "password.weak"));
        passwordRef.current?.focus();
      } else {
        setFailed(true);
      }
    } finally {
      setSending(false);
    }
  }

  if (invalid) {
    return (
      <AuthShell title={t("reset.invalid.title")} focusTitle>
        <p className="text-sm text-muted-foreground">{t("reset.invalid.text")}</p>
        <ResetLinkRequest submitLabel={t("reset.invalid.ask")} />
      </AuthShell>
    );
  }
  if (failed) {
    return (
      <AuthShell title={t("reset.title")}>
        <ErrorState onRetry={() => void submit()} />
      </AuthShell>
    );
  }
  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.intro")}>
      <form noValidate onSubmit={submit} className="space-y-4" aria-busy={sending}>
        <PasswordFields
          password={password}
          confirm={confirm}
          onPassword={setPassword}
          onConfirm={setConfirm}
          error={fieldError}
          inputRef={passwordRef}
          idPrefix="reset"
          labels={{ password: t("reset.password"), confirm: t("reset.confirm") }}
        />
        <p className="text-sm text-muted-foreground">{t("reset.sessionsNote")}</p>
        <Button type="submit" size="lg" className="w-full" disabled={sending || !valid}>
          {sending ? t("reset.sending") : t("reset.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
