import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SupportContact, platformContact } from "@/features/auth/SupportContact";

// Moldura das telas de acesso (canvas): painel escuro da marca a partir de 768 px e formulário de 420 px.
// O contato de suporte fica uma vez só, abaixo do formulário, para valer nos dois tamanhos.
export function AuthShell({
  title,
  subtitle,
  focusTitle,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Leva o foco ao título ao abrir (telas de estado). */
  focusTitle?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusTitle) h1.current?.focus();
  }, [focusTitle]);
  const contact = platformContact();
  return (
    <div className="min-h-screen md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="hidden flex-col justify-between gap-10 bg-sidebar p-12 text-sidebar-foreground md:flex" data-testid="auth-brand">
        <Brand className="text-3xl" />
        <div className="space-y-3">
          <p className="max-w-sm font-heading text-5xl font-semibold uppercase leading-tight">{t("authShell.tagline")}</p>
          <p className="max-w-sm text-sm">{t("authShell.text")}</p>
        </div>
        <SupportContact contact={contact} title={t("authShell.help")} />
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="px-4 py-4 md:hidden">
          <Brand className="text-xl" />
        </header>
        <main className="mx-auto flex w-full max-w-105 flex-1 flex-col gap-6 px-4 pb-10 md:justify-center">
          <div className="space-y-1">
            <h1 ref={h1} tabIndex={focusTitle ? -1 : undefined} className="text-4xl font-semibold uppercase leading-tight outline-none">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          <div className="md:hidden">
            <SupportContact contact={contact} />
          </div>
        </main>
      </div>
    </div>
  );
}

/** Marca das telas de acesso: ícone "ct" na cor de marca e o nome (o `BrandMark` mostra a inicial da organização). */
function Brand({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={`flex items-center gap-2 font-heading font-semibold uppercase tracking-wide ${className ?? ""}`}>
      <span aria-hidden="true" className="inline-flex size-9 items-center justify-center rounded-lg bg-brand text-lg normal-case text-brand-foreground">
        {t("authShell.icon")}
      </span>
      {t("app.name")}
    </span>
  );
}
