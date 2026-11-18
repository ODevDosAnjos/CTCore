import { useState, useRef, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ErrorState } from "@/components/states";
import { AuthShell } from "@/components/layout/AuthShell";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { ApiError, api } from "@/lib/api";
import { Turnstile } from "./Turnstile";

// RF-ACE-03 / RN-ACE-11: a tela nunca diz se o e-mail existe; a caixa azul é a mesma para qualquer e-mail.
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <AuthShell title={t("forgot.title")} subtitle={t("forgot.intro")}>
      <ResetLinkRequest submitLabel={t("forgot.submit")} />
    </AuthShell>
  );
}

/** Pedido do link de nova senha; serve também ao estado "Este link venceu" (`submitLabel` muda). */
export function ResetLinkRequest({ submitLabel }: { submitLabel: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (sending) return;
    setNotice(null);
    setFailed(false);
    if (!email.trim()) {
      setError(t("auth.errors.emailRequired"));
      emailRef.current?.focus();
      return;
    }
    setError(null);
    setSending(true);
    try {
      const body = { email: email.trim(), ...(token ? { challengeToken: token } : {}) };
      await api<{ message: string }>("/auth/password-reset", { method: "POST", body });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setNotice(t("auth.errors.tooMany"));
      else setFailed(true);
    } finally {
      setSending(false);
    }
  }

  if (failed) return <ErrorState onRetry={() => void submit()} />;
  return (
    <form noValidate onSubmit={submit} className="space-y-4" aria-busy={sending}>
      {notice && <Banner tone="danger">{notice}</Banner>}
      <Field label={t("auth.email")} error={error ?? undefined}>
        {(c) => <Input {...c} ref={emailRef} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Turnstile onToken={setToken} resetKey={0} />
      {done && <Banner tone="info">{t("forgot.sent")}</Banner>}
      <Button type="submit" size="lg" className="w-full" disabled={sending}>
        {sending ? t("forgot.sending") : submitLabel}
      </Button>
      <p className="text-center text-sm">
        <Link className="underline" to="/entrar">
          {t("forgot.back")}
        </Link>
      </p>
    </form>
  );
}
