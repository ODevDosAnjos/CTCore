import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router";

// RNF-43: ao mudar de rota (só o pathname), o foco vai para o h1 da tela nova, ou para a área central se não houver h1.
export function useFocusOnRoute(main: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const last = useRef(pathname);
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    const h1 = main.current?.querySelector("h1");
    if (h1) {
      if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
      h1.focus();
    } else main.current?.focus();
  }, [pathname, main]);
}
