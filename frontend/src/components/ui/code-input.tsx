import * as React from "react";
import { cn } from "@/lib/utils";

/** Código em caixas: um único `<input>` real por cima de caixas só desenhadas (preencher, colar e leitor de tela funcionam). */
export const CodeInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; length?: number }
>(function CodeInput({ value, onChange, onComplete, length = 6, className, ...rest }, ref) {
  const [focused, setFocused] = React.useState(false);
  const active = Math.min(value.length, length - 1);
  return (
    <div className={cn("relative flex gap-2", className)}>
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "flex h-16 min-w-0 flex-1 items-center justify-center rounded-lg border-[1.5px] bg-card font-heading text-3xl font-semibold text-foreground",
            value[i] ? "border-foreground" : "border-border",
            focused && i === active && "ring-2 ring-ring",
          )}
        >
          {value[i]}
        </span>
      ))}
      <input
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        spellCheck={false}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, length);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        className="absolute inset-0 size-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
      />
    </div>
  );
});
