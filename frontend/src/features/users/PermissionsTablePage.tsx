import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { useBelowSm } from "@/components/query/useBelowSm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MATRIX, PROFILES } from "./permissionMatrix";

function Content() {
  const { t } = useTranslation();
  const narrow = useBelowSm();
  const cell = (id: string, p: (typeof PROFILES)[number]) => t(`permissionsTable.rows.${id}.${p}`);
  const roleName = (p: (typeof PROFILES)[number]) => t(`layout.roles.${p}`);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={t("permissionsTable.title")}
        subtitle={t("permissionsTable.subtitle")}
        actions={
          <Button asChild variant="ghost">
            <Link to="/configuracoes/usuarios">
              <ChevronLeft aria-hidden="true" />
              {t("permissionsTable.back")}
            </Link>
          </Button>
        }
      />
      <p className="text-[13px] text-muted-foreground">{t("permissionsTable.legend")}</p>
      {narrow ? (
        <ul className="flex flex-col divide-y rounded-card border bg-card px-4">
          {MATRIX.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 py-3">
              <span className="font-semibold">{t(`permissionsTable.rows.${r.id}.label`)}</span>
              <dl className="flex flex-col gap-0.5 text-sm">
                {PROFILES.map((p) => (
                  <div key={p} className="flex gap-2">
                    <dt className="w-28 shrink-0 text-muted-foreground">{roleName(p)}</dt>
                    <dd className="min-w-0 break-words">{cell(r.id, p)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-hidden rounded-card border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-soft text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3.5 py-2.5 font-semibold">
                  {t("permissionsTable.area")}
                </th>
                {PROFILES.map((p) => (
                  <th key={p} scope="col" className="whitespace-nowrap px-3.5 py-2.5 font-semibold">
                    {roleName(p)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.id} className="border-t border-divider">
                  <th scope="row" className="px-3.5 py-2.5 text-left font-semibold">
                    {t(`permissionsTable.rows.${r.id}.label`)}
                  </th>
                  {PROFILES.map((p) => (
                    <td key={p} className="px-3.5 py-2.5 align-middle">
                      {cell(r.id, p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Tabela fixa e só de leitura (#27): quem não gere a equipe já não chega aqui (RequireArea) e o servidor segue como barreira.
export function PermissionsTablePage() {
  return <Content />;
}
