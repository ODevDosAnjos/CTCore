import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { ForbiddenState } from "@/components/states";
import { buttonVariants } from "@/components/ui/button";
import { AreaUnavailableShell } from "./AreaUnavailableShell";
import { ChooseLinkTrigger } from "./ChooseLinkTrigger";
import { useSession } from "./SessionProvider";

// RF-ACE-08: texto único para qualquer área negada (D3); a recusa de dados é do servidor (403).
// Dentro da casca do app: gestão com menu e barra, portal com a do portal; sem vínculo ativo, sem casca.
// `bare`: só o estado; o `ManagementLayout` já é a casca (e chama esta página quando não há menu algum).
export function AreaUnavailablePage({ bare = false }: { bare?: boolean }) {
  const { state } = useSession();
  const session = state.status === "ready" ? state.session : undefined;
  const role = session?.links.find((l) => l.id === session.activeLinkId)?.role;
  if (bare || !role)
    return (
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <AreaUnavailableState role={role} withChoose />
      </main>
    );
  const content = <AreaUnavailableState role={role} />;
  return <AreaUnavailableShell role={role}>{content}</AreaUnavailableShell>;
}

// A casca já traz o botão de trocar organização ou área; sem casca, ele vem aqui.
// Em Financeiro › Cobranças o canvas (EstadoSemAcesso) traz o texto próprio da área e "Voltar ao Início"; o Professor ganha "Ver minhas turmas".
function AreaUnavailableState({ role, withChoose = false }: { role?: string; withChoose?: boolean }) {
  const { t } = useTranslation();
  const finance = useLocation().pathname.startsWith("/cobrancas");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <ForbiddenState
        variant="card"
        level={1}
        titleRef={title}
        title={t("areaUnavailable.title")}
        text={t(finance ? "areaUnavailable.financeText" : "areaUnavailable.text")}
        action={
          <>
            <Link to="/" className={buttonVariants({ size: "lg", className: "w-full" })}>
              {t(finance ? "areaUnavailable.financeHome" : "areaUnavailable.home")}
            </Link>
            {role === "TEACHER" && (
              <Link to="/turmas" className={buttonVariants({ size: "lg", variant: "outline", className: "w-full" })}>
                {t("areaUnavailable.classes")}
              </Link>
            )}
          </>
        }
      />
      {withChoose && (
        <div className="flex justify-center">
          <ChooseLinkTrigger />
        </div>
      )}
    </div>
  );
}
