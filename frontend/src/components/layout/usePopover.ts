import { useEffect, useRef, useState } from "react";

// Menu suspenso simples (D9): fecha com Esc (devolvendo o foco ao botão) e com clique fora.
export function usePopover() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const outside = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("mousedown", outside);
    };
  }, [open]);
  return { open, setOpen, root, button };
}
