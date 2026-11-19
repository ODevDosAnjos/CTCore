import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate } from "react-router";
import { PageHeader } from "@/components/ui/page-header";
import {
  EmptyState,
  ErrorState,
  ForbiddenState,
  LoadingState,
} from "@/components/states";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/ui/coming-soon";
import { LogoutButton } from "@/features/auth/LogoutButton";
import { useSession } from "@/features/auth/SessionProvider";
import { ApiError } from "@/lib/api";
import { OrgMark } from "./OrgMark";
import { usePortalTerm, type PortalTermPending } from "./usePortalTerm";

function Check({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const hintId = useId();
  return (
    <div className="rounded-md border p-3">
      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="size-4 shrink-0 accent-brand"
          aria-describedby={hintId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="min-w-0">{label}</span>
      </label>
      <p
        id={hintId}
        className="ml-7 whitespace-pre-wrap break-words text-xs text-muted-foreground"
      >
        {hint}
      </p>
    </div>
  );
}

function TermBlock({
  item,
  many,
  onAccept,
}: {
  item: PortalTermPending;
  many: boolean;
  onAccept: (imageUse: boolean) => Promise<void>;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const [read, setRead] = useState(false);
  const [image, setImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const submit = async () => {
    setBusy(true);
    setMessage(undefined);
    try {
      await onAccept(image);
    } catch (e) {
      setMessage(
        t(
          e instanceof ApiError && e.status === 409
            ? "portalTerm.errors.conflict"
            : "portalTerm.errors.generic",
        ),
      );
      setBusy(false);
    }
  };
  const version = item.term.version;
  return (
    <section className="flex flex-col gap-4">
      <p id={titleId} className="text-sm font-semibold">
        {many
          ? t("portalTerm.termTitleNamed", { name: item.name, version })
          : t("portalTerm.termTitle", { version })}
      </p>
      <div
        role="region"
        aria-labelledby={titleId}
        tabIndex={0}
        className="h-80 overflow-y-auto rounded-md border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {item.term.body}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ComingSoon variant="button" label={t("portalTerm.download")} />
        <span className="text-xs text-muted-foreground">
          {t("portalTerm.version", { version })}
        </span>
      </div>
      <Check
        label={t("portalTerm.accept")}
        hint={t("portalTerm.acceptHint")}
        checked={read}
        onChange={setRead}
      />
      <Check
        label={t("portalTerm.imageUse", { name: item.name })}
        hint={`${item.imageUse.body} ${t("portalTerm.imageUseHint")}`}
        checked={image}
        onChange={setImage}
      />
      {message && (
        <p role="alert" className="text-sm text-danger-foreground">
          {message}
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <LogoutButton label={t("portalTerm.leave")} />
        <Button className="min-h-11" disabled={!read || busy} onClick={submit}>
          {busy ? t("portalTerm.saving") : t("portalTerm.submit")}
        </Button>
      </div>
    </section>
  );
}

// RN-MAT-11, RN-POR-03: aceite do termo de matrícula no portal, com o uso de imagem em caixa separada e opcional.
export function PortalTermPage() {
  const { t } = useTranslation();
  const { state } = useSession();
  const term = usePortalTerm();
  const [accepted, setAccepted] = useState(false);
  const [initial, setInitial] = useState<PortalTermPending[]>([]);
  if (term.data && term.data.length > 0 && initial.length === 0)
    setInitial(term.data); // D3: a API devolve só os pendentes
  const session = state.status === "ready" ? state.session : undefined;
  const link = session?.links.find((l) => l.id === session.activeLinkId);
  const org = link?.organizationName ?? t("app.name");
  const firstName = session?.account.name?.trim().split(/\s+/)[0];
  const current = term.data?.[0];
  let body;
  if (term.status === "loading") body = <LoadingState />;
  else if (term.status === "forbidden") body = <ForbiddenState />;
  else if (!term.data) body = <ErrorState onRetry={term.retry} />;
  else if (term.data.length === 0 && accepted)
    return <Navigate to="/" replace />;
  else if (term.data.length === 0 || !current) {
    body = (
      <EmptyState
        title={t("portalTerm.emptyTitle")}
        text={t("portalTerm.emptyText")}
        action={
          <Link to="/" className="inline-flex min-h-11 items-center underline">
            {t("portalTerm.emptyAction")}
          </Link>
        }
      />
    );
  } else {
    const pendingIds = new Set(term.data.map((p) => p.id));
    body = (
      <div className="flex flex-col gap-4">
        {initial.length > 1 && (
          <section className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold">
                {t("portalTerm.students")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {t("portalTerm.progress", {
                  done: initial.length - term.data.length,
                  total: initial.length,
                })}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {initial.map((s) => (
                <li key={s.id} className="flex min-h-11 items-center gap-3">
                  <Avatar name={s.name} decorative />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {s.name}
                  </span>
                  <Badge tone={pendingIds.has(s.id) ? "warn" : "ok"}>
                    {t(
                      pendingIds.has(s.id)
                        ? "portalTerm.missing"
                        : "portalTerm.doneNow",
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
        <TermBlock
          key={current.id}
          item={current}
          many={initial.length > 1}
          onAccept={async (imageUse) => {
            await term.accept(current, imageUse);
            setAccepted(true);
          }}
        />
      </div>
    );
  }
  let intro = t("portalTerm.introAdult", { org });
  if (initial.length > 1)
    intro = t("portalTerm.introMany", { count: initial.length });
  else if (link?.role === "GUARDIAN" && current)
    intro = `${firstName ? t("portalTerm.greeting", { name: firstName }) + " " : ""}${t("portalTerm.introGuardian", { student: current.name, org })}`;
  return (
    <>
      <header
        className="flex h-14 items-center gap-2 bg-sidebar px-4 text-sidebar-foreground md:hidden"
        data-testid="term-bar"
      >
        <OrgMark name={org} />
        <span className="truncate font-heading text-lg font-semibold uppercase tracking-wide">
          {org}
        </span>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 md:min-h-screen md:py-10">
        <div className="hidden items-center gap-2 md:flex">
          <OrgMark name={org} />
          <span className="font-heading text-lg font-semibold uppercase tracking-wide">
            {org}
          </span>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("portalTerm.eyebrow")}
          </p>
          <PageHeader title={t("portalTerm.title")} subtitle={intro} />
        </div>
        {body}
      </main>
    </>
  );
}
