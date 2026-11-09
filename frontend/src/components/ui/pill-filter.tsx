import { useContext, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { FilterSheetContext } from "@/components/query/FilterSheet";
import { Select } from "@/components/ui/field";
import { usePopover } from "@/components/layout/usePopover";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };

/** Filtro em pílula do canvas: "Rótulo Valor ⌄" que abre uma lista de uma escolha; a opção "todas" vem primeiro. */
export function PillFilter({ label, value, onChange, allLabel, options, disabled }: { label: string; value: string; onChange: (id: string) => void; allLabel: string; options: Option[]; disabled?: boolean }) {
  const { open, setOpen, root, button } = usePopover();
  const list = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.id === value);
  const active = Boolean(selected);
  const inSheet = useContext(FilterSheetContext);

  // Ao abrir, o foco vai para a opção escolhida (ou para "todas").
  useEffect(() => {
    if (!open) return;
    const rows = list.current?.querySelectorAll<HTMLElement>('[role="option"]');
    const at = selected ? options.indexOf(selected) + 1 : 0;
    rows?.[at]?.focus();
    // só ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choose = (id: string) => {
    onChange(id);
    setOpen(false);
    button.current?.focus();
  };
  const move = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const rows = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") rows[Math.min(rows.length - 1, i + 1)]?.focus();
    else if (e.key === "ArrowUp") rows[Math.max(0, i - 1)]?.focus();
    else return;
    e.preventDefault();
  };

  // Dentro da folha do celular: campo com rótulo acima e seletor nativo.
  if (inSheet)
    return (
      <label className="flex min-w-0 flex-col gap-1 text-sm font-medium text-muted-foreground">
        {label}
        <Select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">{allLabel}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </label>
    );

  return (
    <div ref={root} className="relative min-w-0">
      <button
        ref={button}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-active={active || undefined}
        onClick={() => setOpen(!open)}
        className={cn(
          "relative inline-flex h-9 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm after:absolute after:left-0 after:top-1/2 after:h-11 after:w-full after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          active ? "border-primary bg-primary/10" : "border-input bg-card hover:bg-surface-soft",
        )}
      >
        <span className="text-muted-foreground">{label}</span>{" "}
        <span className="truncate font-medium">{selected?.name ?? allLabel}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          aria-label={label}
          onKeyDown={move}
          className="absolute left-0 top-full z-40 mt-1 max-h-64 min-w-48 max-w-[calc(100vw-2rem)] overflow-auto rounded-md border bg-popover p-1 text-sm shadow-menu"
        >
          {[{ id: "", name: allLabel }, ...options].map((o) => (
            <li
              key={o.id}
              role="option"
              tabIndex={-1}
              aria-selected={o.id === value}
              onClick={() => choose(o.id)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault(); // senão o Enter ativa o botão que acabou de receber o foco
                choose(o.id);
              }}
              className="flex min-h-11 cursor-pointer items-center rounded-sm px-3 hover:bg-surface-soft focus-visible:bg-surface-soft focus-visible:outline-none aria-selected:font-medium"
            >
              {o.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
