import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";

export const ROUTE_PROGRESS_MS = 400;

// Barra fina no topo na troca de tela (RNF-44). Sem roteador de dados não há "carregando" da rota:
// ela vale da troca do endereço até a rota assentar (D3).
export function RouteProgress() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [settled, setSettled] = useState(pathname);
  useEffect(() => {
    const id = setTimeout(() => setSettled(pathname), ROUTE_PROGRESS_MS);
    return () => clearTimeout(id);
  }, [pathname]);
  if (settled === pathname) return null;
  // dentro de uma região com nome: o axe exige todo conteúdo em marco (regra "region")
  return (
    <div role="region" aria-label={t("routeProgress.label")}>
      <div role="progressbar" aria-label={t("routeProgress.label")} className="fixed inset-x-0 top-0 z-70 h-0.5 animate-pulse bg-brand" />
    </div>
  );
}
