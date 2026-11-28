import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";
import { usePopover } from "@/components/layout/usePopover";

type TriggerProps = {
  ref: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": typeof dialog;
};

// Popover do canvas: bloco de 440 px ancorado ao botão, sem escurecer a tela (não modal).
// Fecha com Esc (foco volta ao botão), clique fora e ao navegar (children recebe `close`).
const dialog = "dialog";

export function Popover({
  trigger,
  label,
  children,
  onOpenChange,
  sheet,
}: {
  trigger: (props: TriggerProps) => ReactNode;
  /** Nome acessível do bloco. */
  label: string;
  /** `close` só fecha (ao navegar); `dismiss` fecha e devolve o foco ao botão (Voltar). */
  children: (close: () => void, dismiss: () => void) => ReactNode;
  onOpenChange?: (open: boolean) => void;
  /** Sem margem interna (o conteúdo traz a sua) e, abaixo de 640 px, em tela cheia. */
  sheet?: boolean;
}) {
  const { open, setOpen, root, button } = usePopover();
  const panel = useRef<HTMLDivElement>(null);
  const was = useRef(false);
  useEffect(() => {
    if (was.current === open) return;
    was.current = open;
    onOpenChange?.(open);
  }, [open, onOpenChange]);
  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);
  return (
    <div ref={root} className="relative">
      {trigger({ ref: button, onClick: () => setOpen(!open), "aria-expanded": open, "aria-haspopup": dialog })}
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label={label}
          tabIndex={-1}
          className={cn(
            "z-50 duration-200 animate-in fade-in-0 overflow-y-auto border bg-popover text-popover-foreground shadow-menu sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[min(440px,calc(100vw-2rem))] sm:rounded-[14px]",
            sheet
              ? "fixed inset-0 sm:bottom-auto sm:max-h-[calc(100vh-5rem)]"
              : "fixed inset-x-4 top-16 max-h-[calc(100vh-5rem)] rounded-[14px] p-4",
          )}
        >
          {children(
            () => setOpen(false),
            () => {
              setOpen(false);
              button.current?.focus();
            },
          )}
        </div>
      )}
    </div>
  );
}
