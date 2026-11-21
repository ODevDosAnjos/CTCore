import { useCallback } from "react";
import { useSearchParams } from "react-router";

// RNF-27, D5: a aba ativa fica em `?aba=<id>`. Ausente ou inválida vale `fallback`; trocar usa `replace` (voltar não percorre as abas)
// e mexe só em `aba`, para filtros e painel de fundo ficarem como estão.
export function useTabParam<T extends string>(ids: readonly T[], fallback: T = ids[0]): readonly [T, (id: string) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get("aba");
  const aba = ids.find((id) => id === raw) ?? fallback;
  const setAba = useCallback(
    (id: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("aba", id);
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [aba, setAba] as const;
}
