import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, LogOut } from "lucide-react";
import { LoadingState } from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { LogoutError } from "./LogoutButton";
import { useLogout } from "./useLogout";
import { useSession, type SessionView } from "./SessionProvider";

type Link = SessionView["links"][number];
const PORTAL = ["STUDENT", "GUARDIAN"];
const REMEMBER_KEY = "ctcore.rememberedLink";

// D6: só o id do vínculo fica no aparelho; o servidor confere que ele é da conta (404 se não for).
function remembered(): string | null {
  try {
    return localStorage.getItem(REMEMBER_KEY);
  } catch {
    return null;
  }
}
function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(REMEMBER_KEY, id);
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* sem armazenamento: a página só volta a aparecer na próxima entrada */
  }
}

const units = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

// RF-ACE-05 / RN-ACE-03: página (não janela) que só sai com a escolha ou com "Sair". A área vem do papel do vínculo.
// `onClose`: aberta pelo gatilho da casca, quando a pessoa já tem vínculo ativo (sai também por "Voltar" ou Esc).
// `onChosen`: só quando um vínculo foi escolhido (D2: o gatilho leva ao Início do vínculo novo).
export function ChooseLinkPage({ onClose, onChosen }: { onClose?: () => void; onChosen?: () => void }) {
  const { t } = useTranslation();
  const { state, setSession } = useSession();
  const [pending, setPending] = useState<Link | null>(null);
  const [error, setError] = useState<"failed" | "gone" | null>(null);
  const [retryLink, setRetry] = useState<Link | null>(null);
  const [keep, setKeep] = useState(() => !!remembered());
  const links = state.status === "ready" ? state.session.links : [];
  const [auto, setAuto] = useState(() => !onClose && links.some((l) => l.id === remembered()));
  const title = useRef<HTMLHeadingElement>(null);
  const logout = useLogout();

  async function choose(link: Link, silent = false) {
    setPending(link);
    setError(null);
    try {
      const view = await api<SessionView>("/auth/session/link", { method: "PUT", body: { linkId: link.id } });
      remember(keep || silent ? link.id : null);
      setPending(null);
      setSession(view);
      onChosen?.();
      onClose?.();
    } catch (e) {
      setPending(null);
      setAuto(false);
      if (e instanceof ApiError && e.status === 404) {
        remember(null);
        setKeep(false);
        setError("gone");
        try {
          setSession(await api<SessionView>("/auth/session"));
        } catch {
          /* a lista antiga fica; a pessoa pode tentar de novo */
        }
      } else {
        setError("failed");
        setRetry(link);
      }
    }
  }

  const autoLink = auto ? links.find((l) => l.id === remembered()) : undefined;
  useEffect(() => {
    // só ao abrir: aplica o vínculo lembrado uma vez
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (autoLink) void choose(autoLink, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    title.current?.focus();
  }, [autoLink]);
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !pending && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  if (state.status !== "ready") return null;
  if (autoLink) return <LoadingState />;
  const { activeLinkId, account } = state.session;
  const Wrapper = onClose ? "div" : "main"; // o overlay do gatilho já está dentro do app, que tem o seu `main`
  const first = (account.name ?? account.email).split(/[\s@]/)[0];

  const lastAccess = (l: Link) => {
    if (!l.lastAccessAt) return t("chooseLink.never");
    return formatDate(l.lastAccessAt) === formatDate(new Date())
      ? t("chooseLink.lastToday", { time: formatTime(l.lastAccessAt) })
      : t("chooseLink.lastOn", { date: formatDate(l.lastAccessAt) });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <Wrapper className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-8 md:justify-center md:py-16">
        <span className="font-heading text-2xl font-semibold tracking-wide md:absolute md:left-8 md:top-8">{t("app.name")}</span>
        <section className="space-y-5 md:rounded-xl md:border md:bg-card md:p-7 md:shadow-lg">
          <div className="space-y-1">
            <h1 ref={title} tabIndex={-1} className="text-3xl font-semibold uppercase leading-tight outline-none">
              {t("chooseLink.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("chooseLink.intro", { name: first })}</p>
          </div>
          <ul className="flex flex-col gap-2">
            {links.map((l) => {
              const detail = [
                t(PORTAL.includes(l.role) ? "chooseLink.areas.portal" : "chooseLink.areas.management"),
                t(`chooseLink.roles.${l.role}`),
                l.unitNames?.length ? units.format(l.unitNames) : null,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    className="flex min-h-16 w-full items-center gap-3 rounded-md border bg-card px-4 py-3 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                    disabled={!!pending}
                    aria-current={l.id === activeLinkId ? "true" : undefined}
                    onClick={() => void choose(l)}
                  >
                    <Avatar name={l.organizationName} decorative className="size-11 rounded-lg text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{l.organizationName}</span>{" "}
                      <span className="block text-sm text-muted-foreground">
                        {detail}
                        {l.id === activeLinkId && ` · ${t("chooseLink.current")}`}
                      </span>{" "}
                      <span className="block text-xs text-muted-foreground">{lastAccess(l)}</span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
          {pending && (
            <p role="status" className="text-sm text-muted-foreground">
              {t("chooseLink.sending")}
            </p>
          )}
          {error === "gone" && <Banner tone="danger">{t("chooseLink.errorGone")}</Banner>}
          {error === "failed" && retryLink && (
            <Banner tone="danger">
              <div className="flex flex-col gap-2">
                <p>{t("chooseLink.errorFailed")}</p>
                <Button className="min-h-11 self-start" onClick={() => void choose(retryLink)}>
                  {t("chooseLink.retry")}
                </Button>
              </div>
            </Banner>
          )}
          <div className="flex items-center justify-between gap-3">
            <Checkbox label={t("chooseLink.remember")} checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            <div className="flex items-center gap-1">
              {onClose && (
                <Button type="button" variant="ghost" className="min-h-11" disabled={!!pending} onClick={onClose}>
                  {t("chooseLink.back")}
                </Button>
              )}
              <Button type="button" variant="ghost" className="min-h-11" disabled={logout.pending} onClick={logout.logout}>
                <LogOut aria-hidden className="size-4" />
                {t("chooseLink.logout")}
              </Button>
              {logout.failed && <LogoutError onRetry={logout.logout} />}
            </div>
          </div>
        </section>
      </Wrapper>
    </div>
  );
}
