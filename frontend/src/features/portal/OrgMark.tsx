import { useState } from "react";
import { initials } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Logo da organização; sem imagem (ou com imagem quebrada), quadrado com as iniciais. */
export function OrgMark({ name, logoUrl, className }: { name: string; logoUrl?: string | null; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (logoUrl && !broken) return <img src={logoUrl} alt="" className={cn("size-8 shrink-0 rounded-lg object-contain", className)} onError={() => setBroken(true)} />;
  return (
    <span aria-hidden="true" data-initials={initials(name).slice(0, 2)} className={cn("inline-flex size-8 shrink-0 before:content-[attr(data-initials)] items-center justify-center rounded-lg bg-brand font-heading text-base font-semibold text-brand-foreground", className)} />
  );
}
