import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Data nativa (`date` ou `datetime-local`); o "dd/mm/aaaa" vem do idioma do navegador e o ícone acompanha o tema.
 * `iconLeft`: ícone de calendário à esquerda (canvas das janelas); o indicador nativo vira área clicável do campo todo.
 */
export function DateField({ type = "date", className, iconLeft, ...rest }: Omit<React.ComponentProps<"input">, "type"> & { type?: "date" | "datetime-local"; iconLeft?: boolean }) {
  const input = <Input {...rest} type={type} className={cn("[color-scheme:light] dark:[color-scheme:dark]", iconLeft && "relative pl-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0", className)} />;
  if (!iconLeft) return input;
  return (
    <span className="relative flex items-center">
      <CalendarDays aria-hidden className="pointer-events-none absolute left-3 z-10 size-4 text-muted-foreground" />
      {input}
    </span>
  );
}
