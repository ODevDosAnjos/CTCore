import { useEffect, useState } from "react";

const NARROW = "(max-width: 639px)";

// Mesmo padrão do `useWide` do portal; sem matchMedia (jsdom) vale "largo".
export function useBelowSm() {
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(NARROW).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(NARROW);
    if (!m) return;
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return narrow;
}
