import { useEffect, useRef, type ReactNode } from "react";

// Painel flutuante de um grupo do menu recolhido (D2): ao lado do ícone, não modal. Fecha com Esc (foco volta ao ícone),
// clique fora e ao clicar num subitem (navegar); ao abrir, o foco vai ao primeiro subitem habilitado.
export function GroupFlyout({ title, anchor, onClose, children }: { title: string; anchor: HTMLElement | null; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>("a[href]")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      anchor?.focus();
    };
    const outside = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !anchor?.contains(t)) onClose();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", outside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registra uma vez por abertura
  }, []);
  const rect = anchor?.getBoundingClientRect();
  const top = rect?.top ?? 0;
  return (
    <div
      ref={panel}
      role="dialog"
      onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}
      data-sidebar-scroll
      aria-label={title}
      style={{ left: (rect?.right ?? 72) + 8, top, maxHeight: `calc(100vh - ${top}px - 8px)` }}
      className="fixed z-50 flex w-60 duration-200 animate-in fade-in-0 slide-in-from-left-2 flex-col gap-1 overflow-y-auto rounded-xl border border-sidebar-accent bg-sidebar p-2 text-sidebar-foreground shadow-menu"
    >
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
      {children}
    </div>
  );
}
