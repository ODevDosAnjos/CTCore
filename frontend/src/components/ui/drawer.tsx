import { useRef, type ReactNode, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Gaveta do canvas: 560 px à direita (tela cheia abaixo de 640 px), título em caixa alta, corpo que rola e rodapé fixo.
// Mesmo comportamento da janela: foco preso, Esc fecha e o foco volta a quem abriu.
export function Drawer({
  open,
  onOpenChange,
  title,
  eyebrow,
  badge,
  lead,
  scrim,
  subtitle,
  children,
  footer,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Linha pequena acima do título (ex.: "Turma"). */
  eyebrow?: string;
  /** Selo ao lado do título. */
  badge?: ReactNode;
  /** "canvas": fundo mais claro, como no canvas de Professores. */
  scrim?: "canvas";
  /** Avatar antes do título (painel de pessoa). */
  lead?: ReactNode;
  /** Linhas abaixo do título, como o subtítulo e os selos de uma pessoa. */
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const { t } = useTranslation();
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 z-40", scrim === "canvas" ? "bg-sidebar/30" : "bg-sidebar/70")} />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            (returnFocusRef?.current ?? opener.current)?.focus();
          }}
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-full flex-col overflow-hidden border-l bg-card shadow-panel sm:w-[min(560px,100%)]"
        >
          <div className="flex items-start justify-between gap-2 border-b border-divider px-6 py-4">
            {lead}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {eyebrow && <span className="text-xs text-muted-foreground">{eyebrow}</span>}
              <div className="flex flex-wrap items-center gap-2">
                <Dialog.Title className="break-words font-heading text-[28px] font-semibold uppercase leading-none">{title}</Dialog.Title>
                {badge}
              </div>
              {subtitle}
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label={t("common.close")}>
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-divider bg-surface-soft px-6 py-4">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
