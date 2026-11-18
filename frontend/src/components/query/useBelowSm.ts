import { useEffect, useState } from "react";

// Mesmo padrão do `useWide` do portal; sem matchMedia (jsdom) vale "largo".
function useMedia(query: string) {
  const [narrow, setNarrow] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const m = window.matchMedia?.(query);
    if (!m) return;
    const on = () => setNarrow(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return narrow;
}

export const useBelowSm = () => useMedia("(max-width: 639px)");
/** Moldura da gestão: abaixo de 768 px a tela é a do celular. */
export const useBelowMd = () => useMedia("(max-width: 767px)");
