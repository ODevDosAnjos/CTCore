import { createContext, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useBelowSm } from "./useBelowSm";

/** Verdadeiro dentro da folha: o `PillFilter` vira campo com rótulo e seletor. */
export const FilterSheetContext = createContext(false);

/**
 * Filtros em pílula: a partir de 640 px ficam na linha; abaixo, o botão "Filtros" abre uma folha inferior.
 * Cada filtro existe uma vez só no DOM. Os filtros já gravam no endereço ao escolher; "Ver N" só fecha a folha.
 */
export function FilterSheet({ activeCount, resultsLabel, onClear, children }: { activeCount: number; resultsLabel: string; onClear: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!useBelowSm()) return <>{children}</>;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="relative inline-flex h-9 items-center gap-1.5 rounded-full border border-input bg-card px-3 text-sm after:absolute after:left-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        {activeCount > 0 ? t("query.filtersCount", { count: activeCount }) : t("query.filters")}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-3 overflow-y-auto rounded-t-window bg-background p-4 shadow-window"
        >
          <Dialog.Title className="text-xl font-semibold uppercase">{t("query.filters")}</Dialog.Title>
          <FilterSheetContext.Provider value>
            <div className="flex flex-col gap-3">{children}</div>
          </FilterSheetContext.Provider>
          <Button className="min-h-11" onClick={() => setOpen(false)}>
            {resultsLabel}
          </Button>
          <Button variant="ghost" className="min-h-11" onClick={onClear}>
            {t("query.clear")}
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
