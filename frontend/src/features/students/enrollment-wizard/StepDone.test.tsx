import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { StepDone } from "./StepDone";
import type { EnrollmentConcluded } from "./types";

const perms = vi.hoisted(() => ({ value: "FULL" }));
vi.mock("@/features/permissions/usePermissions", () => ({
  usePermissions: () => ({ status: "ready", permissions: { COLLECTIONS: perms.value }, retry: () => undefined }),
}));

const charge = (id: string, type: "MONTHLY" | "ENROLLMENT_FEE", amountCents: number) => ({ id, type, unitId: "u", referenceMonth: null, dueOn: "2026-10-21", toleranceDays: 5, amountCents });
const result = (inviteStatus: EnrollmentConcluded["inviteStatus"], charges = [charge("c1", "MONTHLY", 15000), charge("c2", "ENROLLMENT_FEE", 8000)]): EnrollmentConcluded => ({
  enrollment: { id: "e", status: "ACTIVE", enrolledAt: null, reopenedAt: null, modalities: [{ primaryClass: { id: "t", name: "Jiu-Jitsu Adulto" } } as never] },
  summary: { modalities: [], units: [], openDebt: { count: 0, totalCents: 0 } },
  termPending: false,
  inviteStatus,
  charges,
});

function setup(r: EnrollmentConcluded, payNow = false, collections = "FULL") {
  perms.value = collections;
  const onBack = vi.fn();
  const onRecord = vi.fn();
  render(
    <ThemeProvider>
      <StepDone name="Ana Souza" detail={{ email: "ana@aluno.example" } as never} result={r} payNow={payNow} onBack={onBack} onRecord={onRecord} />
    </ThemeProvider>,
  );
  return { onBack, onRecord };
}

describe("StepDone (CA19, CA20)", () => {
  it("mostra título, turma, convite com validade e os dois cartões", async () => {
    const { onBack, onRecord } = setup(result("SENT"));
    expect(screen.getByRole("heading", { name: "Ana Souza está matriculado" })).toBeInTheDocument();
    expect(screen.getByText(/Ativo desde hoje na turma Jiu-Jitsu Adulto\. O convite do portal foi enviado para ana@aluno\.example \(vale 7 dias\)\./)).toBeInTheDocument();
    expect(screen.getByText("A cobrança de R$ 230,00 já está no portal com Pix, cartão e boleto.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Pronto, voltar aos alunos" }));
    await userEvent.click(screen.getByRole("button", { name: "Abrir ficha de Ana Souza" }));
    expect(onBack).toHaveBeenCalled();
    expect(onRecord).toHaveBeenCalled();
  });

  it("só SENT traz a validade", () => {
    setup(result("NO_EMAIL"));
    expect(screen.getByText(/Sem convite: o aluno não tem e-mail/)).toBeInTheDocument();
    expect(screen.queryByText(/vale 7 dias/)).toBeNull();
  });

  it("payNow abre a janela da primeira cobrança sozinho", async () => {
    setup(result("MINOR"), true);
    expect(await screen.findByRole("dialog", { name: "Registrar pagamento" })).toBeInTheDocument();
  });

  it("sem COLLECTIONS completo não oferece o botão", async () => {
    setup(result("MINOR"), true, "NONE");
    expect(await screen.findByText(/não tem permissão para registrar pagamentos/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Registrar pagamento" })).toBeNull();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("sem cobranças diz que nenhuma foi criada", () => {
    setup(result("MINOR", []));
    expect(screen.getAllByText("Nenhuma cobrança foi criada: o valor final é zero.").length).toBeGreaterThan(0);
  });
});
