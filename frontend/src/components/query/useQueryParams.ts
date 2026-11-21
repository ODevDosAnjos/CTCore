import { useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

// RNF-27: estado da consulta no endereço, lido e escrito pelo roteador. Valores inválidos viram o padrão na leitura.
export function useQueryParams() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";

  // `set` e `clear` têm identidade estável: abrir um painel (rota-filha) não pode refazer a busca da lista.
  // `latest` é o endereço mais novo: duas chamadas seguidas (ex.: trocar a modalidade e limpar o nível) se somam.
  const latest = useRef({ params, setParams });
  useEffect(() => {
    latest.current = { params, setParams };
  });

  // Mudar qualquer filtro volta para a página 1, salvo quando a própria página é mudada.
  const set = useCallback((changes: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(latest.current.params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("pagina" in changes)) next.delete("pagina");
    latest.current.params = next;
    latest.current.setParams(next, { replace });
  }, []);

  const clear = useCallback(() => {
    latest.current.params = new URLSearchParams();
    latest.current.setParams(latest.current.params);
  }, []);

  return { get, set, clear };
}
