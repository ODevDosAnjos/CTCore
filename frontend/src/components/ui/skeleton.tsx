import { cn } from "@/lib/utils";

// Barra de esqueleto (RNF-44): só enfeite, quem lê o carregamento é o texto `sr-only` de quem a usa.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-neutral", className)} />;
}
