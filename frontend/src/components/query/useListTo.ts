import { useLocation, type To } from "react-router";

// Parâmetros que só valem para o painel aberto (D3 da #676): saem ao fechar; filtros, página, ordem e tamanho ficam.
const PANEL_PARAMS = ["aba", "cobranca", "pedido"];

/** Endereço da lista, com os filtros do endereço atual e sem os parâmetros do painel. */
export function useListTo(pathname: string): To {
  const { search } = useLocation();
  return { pathname, search: listSearch(search) };
}

export function listSearch(search: string): string {
  const p = new URLSearchParams(search);
  for (const k of PANEL_PARAMS) p.delete(k);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}
