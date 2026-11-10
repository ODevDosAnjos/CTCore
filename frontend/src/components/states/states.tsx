import type { ReactNode, Ref } from "react";
import { Ban, Inbox, Lock, RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { StateCard } from "./StateCard";

// Estados de tela (RNF-25). Textos padrão vêm de pt-BR.json; cada tela pode passar os seus, já traduzidos (D7).
// `variant="card"` é o visual do canvas (opt-in): sem ele vale o de sempre, até cada tela migrar.
type Card = { variant?: "card" };

export function LoadingState({ text, variant }: { text?: string } & Card) {
  const { t } = useTranslation();
  if (variant === "card")
    return (
      <StateCard role="status">
        <div aria-hidden className="flex w-full max-w-sm flex-col gap-2">
          <div className="h-4 w-1/2 animate-pulse self-center rounded-md bg-neutral" />
          <div className="h-3 w-full animate-pulse rounded-md bg-neutral" />
          <div className="h-3 w-5/6 animate-pulse self-center rounded-md bg-neutral" />
        </div>
        <p className="text-sm text-muted-foreground">{text ?? t("states.loadingCard")}</p>
      </StateCard>
    );
  return (
    <div role="status" className="flex flex-col gap-3 py-8">
      <span className="sr-only">{text ?? t("states.loading")}</span>
      <div aria-hidden className="h-6 w-1/3 animate-pulse rounded-md bg-neutral" />
      <div aria-hidden className="h-4 w-full animate-pulse rounded-md bg-neutral" />
      <div aria-hidden className="h-4 w-5/6 animate-pulse rounded-md bg-neutral" />
    </div>
  );
}

export function EmptyState({ title, text, action, variant }: { title?: string; text?: string; action?: ReactNode } & Card) {
  const { t } = useTranslation();
  if (variant === "card") return <StateCard icon={Inbox} title={title ?? t("states.emptyTitle")} text={text ?? t("states.emptyText")} actions={action} />;
  return (
    <section className="flex flex-col items-center gap-3 py-8 text-center">
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-neutral text-neutral-foreground">
        <Inbox className="size-6" />
      </span>
      <h2 className="font-heading text-xl font-semibold">{title ?? t("states.emptyTitle")}</h2>
      <p className="text-muted-foreground">{text ?? t("states.emptyText")}</p>
      {action}
    </section>
  );
}

export function ErrorState({
  onRetry,
  retryLabel,
  variant,
  title,
  secondary,
}: {
  onRetry: () => void;
  retryLabel?: string;
  title?: string;
  secondary?: ReactNode;
} & Card) {
  const { t } = useTranslation();
  if (variant === "card")
    return (
      <StateCard
        role="alert"
        tone="danger"
        icon={TriangleAlert}
        title={title ?? t("states.errorTitle")}
        text={t("states.errorText")}
        actions={
          <>
            <Button icon={<RefreshCw />} onClick={onRetry}>
              {retryLabel ?? t("states.retry")}
            </Button>
            {secondary}
          </>
        }
      />
    );
  return (
    <section role="alert" className="flex flex-col items-center gap-2 py-8 text-center">
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-danger text-danger-foreground">
        <TriangleAlert className="size-6" />
      </span>
      <h2 className="font-heading text-xl font-semibold">{t("errors.generic.title")}</h2>
      <p>{t("errors.generic.aconteceu")}</p>
      <p>{t("errors.generic.alterado")}</p>
      <p>{t("errors.generic.fazer")}</p>
      <Button onClick={onRetry}>
        {retryLabel ?? t("states.retry")}
      </Button>
    </section>
  );
}

// Só exibe: quem recusa é o servidor. Não recebe o conteúdo protegido.
export function ForbiddenState({
  variant,
  title,
  text,
  action,
  level,
  titleRef,
}: { title?: string; text?: string; action?: ReactNode; level?: 1 | 2; titleRef?: Ref<HTMLHeadingElement> } & Card = {}) {
  const { t } = useTranslation();
  if (variant === "card")
    return <StateCard tone="warn" icon={Lock} framed title={title ?? t("states.forbiddenTitle")} text={text ?? t("states.forbiddenText")} actions={action} level={level} titleRef={titleRef} />;
  return (
    <section className="flex flex-col items-center gap-2 py-8 text-center">
      <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-warn text-warn-foreground">
        <Lock className="size-6" />
      </span>
      <h2 className="font-heading text-xl font-semibold">{t("states.forbiddenTitle")}</h2>
      <p className="text-muted-foreground">{t("states.forbiddenText")}</p>
    </section>
  );
}

// Impedimento de uma ação (ex.: desativar com pendências): o corpo costuma ser um `BlockerChecklist`.
export function BlockedState({ title, text, children, actions }: { title: string; text?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <StateCard tone="danger" icon={Ban} title={title} text={text} actions={actions}>
      {children}
    </StateCard>
  );
}

// Link de redefinição ou convite vencido: o corpo é o campo de e-mail (já preenchido pela tela); as ações reenviam ou voltam.
export function LinkExpiredState({ title, text, children, actions }: { title: string; text?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <StateCard tone="warn" title={title} text={text} actions={actions}>
      {children}
    </StateCard>
  );
}
