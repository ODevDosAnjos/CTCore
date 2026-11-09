import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";

const SIZE_CLASS = { sm: "size-8", md: "size-9" } as const;

// Avatar da lista: foto quando existe, senão as iniciais coloridas do `Avatar`.
export function PersonAvatar({ name, photoUrl, size = "md" }: { name: string; photoUrl?: string | null; size?: "sm" | "md" }) {
  return photoUrl ? <img src={photoUrl} alt="" className={cn("shrink-0 rounded-full object-cover", SIZE_CLASS[size])} /> : <Avatar name={name} decorative size={size} />;
}

// Linha de lista com pessoa: avatar, nome (ou `title`), selos, texto secundário e ação no fim.
export function PersonRow({
  name,
  photoUrl,
  title,
  secondary,
  badges,
  action,
  size,
  className,
}: {
  name: string;
  photoUrl?: string | null;
  title?: ReactNode;
  secondary?: ReactNode;
  badges?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <PersonAvatar name={name} photoUrl={photoUrl} size={size} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 break-words text-sm font-medium">{title ?? name}</span>
          {badges}
        </div>
        {secondary && <p className="break-words text-xs text-muted-foreground">{secondary}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
