import * as React from "react";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Data nativa (`date` ou `datetime-local`); o "dd/mm/aaaa" vem do idioma do navegador e o ícone acompanha o tema. */
export function DateField({ type = "date", className, ...rest }: Omit<React.ComponentProps<"input">, "type"> & { type?: "date" | "datetime-local" }) {
  return <Input {...rest} type={type} className={cn("[color-scheme:light] dark:[color-scheme:dark]", className)} />;
}
