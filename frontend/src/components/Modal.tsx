import { useRef, type ReactNode, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Janela: título como nome acessível, foco preso, Esc fecha e o Radix devolve o foco a quem abriu.
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
  dismissible = true,
  returnFocusRef,
  footer,
  size,
  scrim,
  headless,
  fullOnMobile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
  /** Falso: sem Esc, sem clique fora e sem botão de fechar (a pessoa precisa decidir). */
  dismissible?: boolean;
  /** Quem recebe o foco ao fechar, quando a janela abre depois de uma resposta e o foco original se perdeu. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  footer?: ReactNode;
  /** Janela do canvas: largura (sm 540 px, md 600 px, lg 760 px), título em caixa alta e rodapé fixo. Sem ele, o visual de sempre. */
  size?: "sm" | "md" | "lg";
  /** "canvas": fundo mais claro, como nas janelas do canvas de Professores (as demais telas migram nas suas issues). */
  scrim?: "canvas";
  /** Sem faixa de título: o título fica só para leitor de tela e o chamador desenha o cabeçalho e o botão de fechar (ficha do aluno). */
  headless?: boolean;
  /** Abaixo de 640 px a janela ocupa a tela, com seta de voltar, corpo rolável e rodapé fixo (Encerrar modalidade). */
  fullOnMobile?: boolean;
}) {
  const { t } = useTranslation();
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn("fixed inset-0 z-40", scrim === "canvas" ? "bg-sidebar/50" : "bg-sidebar/70")} />
        <Dialog.Content
          aria-describedby={undefined}
          onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
          onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
          // Aberta por estado (sem Trigger), o Radix não sabe quem abriu: guardamos e devolvemos o foco.
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            (returnFocusRef?.current ?? opener.current)?.focus();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-full w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex flex-col overflow-hidden rounded-window border bg-card",
            size === "sm" ? "max-w-[540px]" : size === "md" ? "max-w-[600px]" : size === "lg" ? "max-w-[760px]" : "max-w-lg",
            fullOnMobile && "max-sm:left-0 max-sm:top-0 max-sm:h-full max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
            className,
          )}
        >
          {headless ? (
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
          ) : (
            <div className={cn("flex items-center justify-between gap-2 border-b border-divider", size ? "px-6 py-4" : "px-4 py-3")}>
              {fullOnMobile && dismissible && (
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden" aria-label={t("common.back")}>
                    <ArrowLeft aria-hidden="true" />
                  </Button>
                </Dialog.Close>
              )}
              <Dialog.Title className={cn("font-heading font-semibold", size ? "text-[28px] uppercase leading-none" : "text-xl")}>{title}</Dialog.Title>
              {dismissible && (
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label={t("common.close")}>
                    <X aria-hidden="true" />
                  </Button>
                </Dialog.Close>
              )}
            </div>
          )}
          <div className={cn("min-h-0 flex-1 overflow-y-auto", size ? "p-6" : "p-4")}>{children}</div>
          {footer && <div className={cn("flex justify-end gap-2 border-t border-divider bg-surface-soft", size ? "px-6 py-4" : "px-4 py-3")}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
