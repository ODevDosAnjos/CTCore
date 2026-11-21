import { useNavigate, useOutletContext, useParams } from "react-router";
import { useListTo } from "@/components/query/useListTo";
import { ChargePanel } from "./ChargePanel";

// O que a lista de cobranças passa ao painel (rota-filha): recarregar a lista depois de cancelar ou renegociar.
export interface ChargesOutlet {
  reload: () => void;
}

// RF-COB-02: painel da cobrança sobre a lista (rota-filha de /cobrancas); fechar volta à lista com os filtros.
export function ChargePanelPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const list = useListTo("/cobrancas");
  const ctx = useOutletContext<ChargesOutlet | null>();
  return <ChargePanel id={id} onClose={() => void navigate(list)} onChanged={ctx?.reload} />;
}
