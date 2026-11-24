import { useTranslation } from "react-i18next";
import { formatCurrency } from "@/lib/format";

// RN-ASS-21: custo da vaga de Administrador. O valor vem do servidor; aqui só se multiplica e se formata.
// `added` = unidades que passam a ocupar vaga; sem ele, mostra só o valor por unidade.
export function SeatCost({ price, added }: { price: number; added?: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-muted px-3 py-2 text-[13px]" data-testid="seat-cost">
      <span className="font-medium">{t("administrators.cost.perUnit", { price: formatCurrency(price) })}</span>
      {added !== undefined && added > 0 && <span>{t("administrators.cost.rise", { total: formatCurrency(price * added) })}</span>}
    </div>
  );
}
