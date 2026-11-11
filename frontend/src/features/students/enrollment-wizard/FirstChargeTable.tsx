import { useTranslation } from "react-i18next";
import { formatMoney } from "@/components/fields/masks";
import { Badge } from "@/components/ui/badge";

export interface ChargeRow {
  key: string;
  label: string;
  /** Selo ao lado do nome (ex.: "Isenta"). */
  badge?: string;
  due: string;
  /** Valor cheio riscado, quando a linha está isenta. */
  struck?: number;
  cents: number;
  /** Coluna "Por meio, com a taxa" (só no resumo). */
  methods?: string;
  /** Nota sob o vencimento (ex.: "gerada em 31/10"). */
  note?: string;
}

// Tabela da primeira cobrança (etapa 3) e das cobranças com o valor por meio (etapa 4).
export function FirstChargeTable({ rows, total, withMethods }: { rows: ChargeRow[]; total?: number; withMethods?: boolean }) {
  const { t } = useTranslation();
  const k = "enrollmentWizard.table.";
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">{t(`${k}charge`)}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{t(`${k}due`)}</th>
            <th scope="col" className="py-2 pr-3 text-right font-semibold">{t(`${k}value`)}</th>
            {withMethods && <th scope="col" className="py-2 font-semibold">{t(`${k}methods`)}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b align-top">
              <th scope="row" className="py-2 pr-3 font-medium">
                {r.label} {r.badge && <Badge tone="neutral">{r.badge}</Badge>}
              </th>
              <td className="py-2 pr-3">
                {r.due}
                {r.note && <span className="block text-xs text-muted-foreground">{r.note}</span>}
              </td>
              <td className="whitespace-nowrap py-2 pr-3 text-right">
                {r.struck !== undefined && <del className="mr-2 text-muted-foreground">{formatMoney(r.struck)}</del>}
                {formatMoney(r.cents)}
              </td>
              {withMethods && <td className="py-2">{r.methods ?? "—"}</td>}
            </tr>
          ))}
        </tbody>
        {total !== undefined && (
          <tfoot>
            <tr className="font-semibold">
              <th scope="row" className="py-2 pr-3">{t(`${k}total`)}</th>
              <td />
              <td className="whitespace-nowrap py-2 pr-3 text-right">{formatMoney(total)}</td>
              {withMethods && <td />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
