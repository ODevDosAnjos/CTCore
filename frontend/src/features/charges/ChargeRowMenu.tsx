import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePopover } from "@/components/layout/usePopover";
import { ComingSoon } from "@/components/ui/coming-soon";

const item = "flex min-h-11 w-full items-center rounded-md px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Menu "..." da linha (D6): "Abrir cobrança" funciona; registrar pagamento, cancelar e renegociar ficam "Em breve" até as janelas da cobrança serem ligadas à linha.
// Posição fixa (calculada ao abrir) para a tabela, que rola na horizontal, não cortar o menu nas últimas linhas.
export function ChargeRowMenu({ label, onOpen }: { label: string; onOpen: () => void }) {
  const { t } = useTranslation();
  const { open, setOpen, root, button } = usePopover();
  const [at, setAt] = useState({ top: 0, right: 0 });
  const toggle = () => {
    const box = button.current?.getBoundingClientRect();
    if (box) setAt({ top: box.bottom + 4, right: window.innerWidth - box.right });
    setOpen(!open);
  };
  return (
    <div ref={root} className="relative flex justify-end">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="relative inline-flex size-8 items-center justify-center rounded-md border border-input bg-card hover:bg-surface-soft after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Ellipsis aria-hidden="true" className="size-4" />
      </button>
      {open && (
        <div role="menu" style={at} className="fixed z-40 w-56 rounded-card border bg-popover p-1 text-popover-foreground shadow-menu">
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              onOpen();
            }}
          >
            {t("charges.menu.open")}
          </button>
          <ComingSoon variant="menuitem" label={t("charges.menu.pay")} />
          <ComingSoon variant="menuitem" label={t("charges.menu.cancel")} />
          <ComingSoon variant="menuitem" label={t("charges.menu.renegotiate")} />
        </div>
      )}
    </div>
  );
}
