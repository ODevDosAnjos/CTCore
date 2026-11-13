import { useState } from "react";
import { Ellipsis } from "lucide-react";
import { useTranslation } from "react-i18next";
import { usePopover } from "@/components/layout/usePopover";
import { ComingSoon } from "@/components/ui/coming-soon";
import { RegisterPaymentDialog } from "@/features/payments/RegisterPaymentDialog";
import { CancelChargeDialog } from "./CancelChargeDialog";
import { useReference } from "./ChargeCards";
import { RenegotiateDialog } from "./RenegotiateDialog";
import type { ChargeRow } from "./types";

const item =
  "flex min-h-11 w-full items-center rounded-md px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const OPEN = ["PENDING", "DUE_TODAY", "OVERDUE"];
const ACTIONS = ["pay", "renegotiate", "cancel"] as const;
const muted =
  "flex min-h-11 w-full cursor-not-allowed items-center rounded-md px-3 text-sm opacity-50";

// Menu "..." da linha (D6, D10): abre o painel e as janelas Registrar pagamento, Renegociar e Cancelar cobrança; a linha não traz `actions`,
// então a regra é a situação (em aberto) e o servidor segue como barreira. As janelas ficam fora do menu. Estornar é "Em breve" (item 104).
// Posição fixa (calculada ao abrir) para a tabela, que rola na horizontal, não cortar o menu nas últimas linhas.
export function ChargeRowMenu({
  row,
  label,
  onOpen,
  onDone,
}: {
  row: ChargeRow;
  label: string;
  onOpen: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const reference = useReference();
  const [dialog, setDialog] = useState<"pay" | "renegotiate" | "cancel">();
  const [paid, setPaid] = useState(false);
  const canAct = OPEN.includes(row.status);
  const choose = (d: "pay" | "renegotiate" | "cancel") => {
    setOpen(false);
    setDialog(d);
  };
  const { open, setOpen, root, button } = usePopover();
  const [at, setAt] = useState({ top: 0, right: 0 });
  const toggle = () => {
    const box = button.current?.getBoundingClientRect();
    if (box)
      setAt({ top: box.bottom + 4, right: window.innerWidth - box.right });
    setOpen(!open);
  };
  return (
    <div ref={root} className="relative flex justify-end">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="relative inline-flex size-8 items-center justify-center rounded-md border border-input bg-card hover:bg-surface-soft after:absolute after:left-1/2 after:top-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Ellipsis aria-hidden="true" className="size-4" />
      </button>
      {open && (
        <div
          role="menu"
          style={at}
          className="fixed z-40 w-56 rounded-card border bg-popover p-1 text-popover-foreground shadow-menu"
        >
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              onOpen();
            }}
          >
            {t("charges.menu.open")}
          </button>
          {ACTIONS.map((d) =>
            canAct ? (
              <button
                key={d}
                type="button"
                role="menuitem"
                className={item}
                onClick={(e) => {
                  // O menu some antes do clique chegar à linha; sem isto a linha abriria o painel por cima da janela.
                  e.stopPropagation();
                  choose(d);
                }}
              >
                {t(`charges.menu.${d}`)}
              </button>
            ) : (
              <span
                key={d}
                role="menuitem"
                tabIndex={0}
                aria-disabled="true"
                aria-describedby={`why-${row.id}`}
                className={muted}
              >
                {t(`charges.menu.${d}`)}
              </span>
            ),
          )}
          <ComingSoon variant="menuitem" label={t("charges.menu.refund")} />
          {!canAct && (
            <p
              id={`why-${row.id}`}
              className="px-3 py-1 text-xs text-muted-foreground"
            >
              {t("charges.menu.notOpen")}
            </p>
          )}
        </div>
      )}
      {/* As janelas vão para o fim da página, mas os eventos delas sobem pela árvore do React até a linha (que abriria o painel): este invólucro os segura. */}
      <div hidden onClick={(e) => e.stopPropagation()}>
        {dialog === "pay" && (
          <RegisterPaymentDialog
            chargeId={row.id}
            charge={{
              student: row.student.name,
              label: reference(row),
              dueOn: row.dueOn,
              unitName: row.unit.name,
            }}
            amountCents={row.amountCents}
            onPaid={() => setPaid(true)}
            onClose={() => {
              setDialog(undefined);
              if (paid) {
                setPaid(false);
                onDone();
              }
            }}
          />
        )}
        {dialog === "renegotiate" && (
          <RenegotiateDialog
            charge={row}
            onClose={() => setDialog(undefined)}
            onDone={onDone}
          />
        )}
        {dialog === "cancel" && (
          <CancelChargeDialog
            charge={row}
            onClose={() => setDialog(undefined)}
            onDone={onDone}
          />
        )}
      </div>
    </div>
  );
}
