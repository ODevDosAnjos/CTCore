import { useCallback } from "react";
import { useSearchParams } from "react-router";

// RNF-27, D5: a aba ativa fica em `?aba=<id>`. Ausente ou inválida vale `fallback`; trocar usa `replace` (voltar não percorre as abas)
// e mexe só em `aba`, para filtros e painel de fundo ficarem como estão.
// `param` troca o nome quando há abas dentro de abas (item 747: o tipo de termo é `?termo=`).
export function useTabParam<T extends string>(ids: readonly T[], fallback: T = ids[0], param = "aba"): readonly [T, (id: string) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(param);
  const aba = ids.find((id) => id === raw) ?? fallback;
  const setAba = useCallback(
    (id: string) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(param, id);
          return next;
        },
        { replace: true },
      ),
    [setParams, param],
  );
  return [aba, setAba] as const;
}
