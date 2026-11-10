import type { ComponentType, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  danger: "text-danger-foreground",
  warn: "text-warn-foreground",
  neutral: "text-neutral-foreground",
  ok: "text-ok-foreground",
} as const;

const FRAMES = {
  danger: "bg-danger text-danger-foreground",
  warn: "bg-warn text-warn-foreground",
  neutral: "bg-neutral text-neutral-foreground",
  ok: "bg-ok text-ok-foreground",
} as const;

/** Cartão base dos estados do canvas: ícone sem círculo, título em caixa alta, texto, corpo livre e ações. */
export function StateCard({
  tone = "neutral",
  icon: Icon,
  framed = false,
  title,
  text,
  children,
  actions,
  role,
  level = 2,
  titleRef,
  className,
}: {
  tone?: keyof typeof TONES;
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  /** Ícone num quadro arredondado (canvas Sem acesso, M4). */
  framed?: boolean;
  title?: string;
  text?: string;
  children?: ReactNode;
  actions?: ReactNode;
  role?: "alert" | "status";
  /** Nível do título: 1 quando o cartão é a página inteira. */
  level?: 1 | 2;
  /** Para a tela levar o foco ao título. */
  titleRef?: Ref<HTMLHeadingElement>;
  className?: string;
}) {
  const Heading = `h${level}` as const;
  return (
    <section role={role} className={cn("flex flex-col items-center gap-3 rounded-card border bg-card p-6 text-center text-card-foreground sm:p-8", className)}>
      {Icon &&
        (framed ? (
          <span aria-hidden data-testid="state-icon-frame" className={cn("flex size-14 items-center justify-center rounded-card", FRAMES[tone])}>
            <Icon aria-hidden className="size-7" />
          </span>
        ) : (
          <Icon aria-hidden className={cn("size-8", TONES[tone])} />
        ))}
      {title && (
        <Heading ref={titleRef} tabIndex={titleRef ? -1 : undefined} className="font-heading text-lg font-semibold uppercase tracking-wide focus:outline-none">
          {title}
        </Heading>
      )}
      {text && <p className="max-w-prose text-sm text-muted-foreground">{text}</p>}
      {children}
      {actions && <div className="flex w-full flex-wrap items-center justify-center gap-2">{actions}</div>}
    </section>
  );
}
