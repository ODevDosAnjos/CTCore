import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { DeactivateClassDialog } from "./DeactivateClassDialog";
import type { ClassDetail } from "./useClasses";

const klass = (over: Partial<ClassDetail["deactivation"]> = {}) =>
  ({
    id: "c1",
    name: "Judô Infantil",
    unit: { id: "u1", name: "Tijuca" },
    deactivation: { allowed: true, blockingStudents: 0, blockingList: [], ...over },
  }) as ClassDetail;

function open(k: ClassDetail) {
  const onClose = vi.fn();
  const onDone = vi.fn();
  render(
    <ThemeProvider>
      <MemoryRouter>
        <DeactivateClassDialog klass={k} onClose={onClose} onDone={onDone} />
      </MemoryRouter>
    </ThemeProvider>,
  );
  return { onClose, onDone, dialog: screen.getByRole("dialog") };
}

describe("DeactivateClassDialog (CA8)", () => {
  it("turma livre: título em caixa alta, subtítulo, aviso, e confirmar desativa", async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(http.post("/api/v1/classes/c1/deactivate", () => { calls += 1; return HttpResponse.json({}); }));
    const { dialog, onDone, onClose } = open(klass());
    expect(within(dialog).getByRole("heading", { name: "Desativar turma" })).toHaveClass("uppercase");
    expect(within(dialog).getByText("Judô Infantil · Tijuca")).toBeInTheDocument();
    expect(within(dialog).getByText(/não pode ser reativada nem editada/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Desativar turma" }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(calls).toBe(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("com alunos principais abre bloqueada: caixa rosa, lista, 'e mais N', orientação e só Fechar", () => {
    const { dialog } = open(
      klass({
        allowed: false,
        blockingStudents: 22,
        blockingList: [
          { id: "s1", name: "Davi Nogueira", modality: "Jiu-Jitsu" },
          { id: "s2", name: "Nicolas Pereira", modality: "Jiu-Jitsu" },
        ],
      }),
    );
    expect(within(dialog).getByText("Ainda há alunos com esta turma como principal")).toBeInTheDocument();
    expect(within(dialog).getByText("Davi Nogueira · Jiu-Jitsu")).toBeInTheDocument();
    expect(within(dialog).getByText("Nicolas Pereira · Jiu-Jitsu")).toBeInTheDocument();
    expect(within(dialog).getByText("e mais 20 alunos")).toBeInTheDocument();
    expect(within(dialog).getByText("Troque a turma principal desses alunos e tente de novo.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Desativar turma" })).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Cancelar" })).toBeNull();
    expect(within(dialog).getAllByRole("button", { name: "Fechar" }).length).toBeGreaterThan(0);
  });

  it("409 HAS_PRIMARY_STUDENTS: a janela passa a mostrar a lista que veio nele, sem nova chamada", async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.post("/api/v1/classes/c1/deactivate", () => {
        calls += 1;
        return HttpResponse.json(
          {
            code: "HAS_PRIMARY_STUDENTS",
            fields: [
              { field: "primaryStudents", message: "1" },
              { field: "student", message: "Davi Nogueira · Judô" },
            ],
          },
          { status: 409 },
        );
      }),
    );
    const { dialog, onDone } = open(klass());
    await user.click(within(dialog).getByRole("button", { name: "Desativar turma" }));
    expect(await within(dialog).findByText("Davi Nogueira · Judô")).toBeInTheDocument();
    expect(within(dialog).queryByText(/e mais/)).toBeNull();
    expect(within(dialog).queryByRole("button", { name: "Desativar turma" })).toBeNull();
    expect(calls).toBe(1);
    expect(onDone).not.toHaveBeenCalled();
  });

  it.each([
    [403, "FORBIDDEN", "Você não tem permissão para desativar esta turma."],
    [409, "CONFLICT", "A turma já está desativada."],
    [500, "INTERNAL_ERROR", "Não foi possível desativar. Nada foi alterado."],
  ])("erro %i aparece na janela", async (status, code, text) => {
    const user = userEvent.setup();
    server.use(http.post("/api/v1/classes/c1/deactivate", () => HttpResponse.json({ code }, { status })));
    const { dialog } = open(klass());
    await user.click(within(dialog).getByRole("button", { name: "Desativar turma" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(text);
  });

  it.each([
    ["claro", false],
    ["escuro", true],
  ])("bloqueada, sem violações no axe no tema %s", async (_n, dark) => {
    setDevicePrefersDark(dark);
    const { dialog } = open(klass({ allowed: false, blockingStudents: 3, blockingList: [{ id: "s1", name: "Davi Nogueira", modality: "Judô" }] }));
    expect(await axeViolations(dialog)).toEqual([]);
  });
});
