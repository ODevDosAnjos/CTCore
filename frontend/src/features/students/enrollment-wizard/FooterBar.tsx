import type { ReactNode } from "react";

// Barra Voltar/Continuar do assistente: no fim do cartão; no celular, fixa acima da barra de abas do app (o aviso fica acima dos botões).
export function FooterBar({ notice, children }: { notice?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 max-sm:fixed max-sm:inset-x-0 max-sm:bottom-14 max-sm:z-20 max-sm:border-t max-sm:bg-card max-sm:p-3">
      {notice}
      <div className="flex justify-between gap-2">{children}</div>
    </div>
  );
}
