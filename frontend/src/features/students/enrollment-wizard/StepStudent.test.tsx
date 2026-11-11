import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { StepStudent } from "./StepStudent";
import { emptyStudentDraft, type WizardStudent } from "./types";

// FormData do jsdom não passa pelo fetch do Node: o envio da foto é trocado por um duplo.
const photo = vi.hoisted(() => vi.fn());
vi.mock("../useStudentRecord", async (original) => ({ ...(await original<typeof import("../useStudentRecord")>()), uploadStudentPhoto: photo }));

const ADULT_CPF = "52998224725";
const NEW_CPF = "11144477735";
const CENTRO = "00000000-0000-0000-0000-000000000021";

const onConfirm = vi.fn<(s: WizardStudent, photoFailed?: boolean) => void>();
const onCancel = vi.fn();
type Initial = Partial<ReturnType<typeof emptyStudentDraft>>;

function Harness({ initial }: { initial?: Initial }) {
  const [draft, setDraft] = useState(() => ({ ...emptyStudentDraft(), ...initial }));
  return <StepStudent draft={draft} onDraft={setDraft} onConfirm={onConfirm} onCancel={onCancel} />;
}

async function setup(initial?: Initial) {
  await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ana@exemplo.com", password: "segredo123" }) });
  render(
    <ThemeProvider>
      <MemoryRouter>
        <SessionProvider>
          <Harness initial={initial} />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
  await screen.findByLabelText(/Nome completo/);
}

const adult: Initial = { unitId: CENTRO, name: "Adulto Novo", birthDate: "1990-01-10", email: "adulto@exemplo.example", phone: "21999990000", postalCode: "01001000", street: "Rua A", number: "10", district: "Centro", city: "Rio", state: "RJ", cpf: NEW_CPF };

let body: Record<string, unknown> | undefined;
const created = { id: "00000000-0000-0000-0000-0000000009aa", name: "Adulto Novo", photoUrl: null };
function capture() {
  body = undefined;
  server.use(
    http.post("/api/v1/students", async ({ request }) => {
      body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json(created, { status: 201 });
    }),
  );
}

describe("etapa 1 do assistente: cadastro completo (RF-MAT-01, RN-ALU-06)", () => {
  beforeEach(() => {
    onConfirm.mockReset();
    onCancel.mockReset();
    photo.mockReset();
  });

  it("CA4: adulto sem preencher mostra cada campo obrigatório e não envia nada", async () => {
    const user = userEvent.setup();
    capture();
    await setup();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect((await screen.findAllByText("Campo obrigatório.")).length).toBeGreaterThanOrEqual(5);
    expect(body).toBeUndefined();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("CA4: tudo certo cadastra com referral e contato de emergência completo", async () => {
    const user = userEvent.setup();
    capture();
    await setup({ ...adult, referral: "INSTAGRAM", emergencyName: "Contato Fictício", emergencyRelationship: "Irmã", emergencyPhone: "21988887777" });
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(body).toMatchObject({ cpf: NEW_CPF, referral: "INSTAGRAM", emergencyName: "Contato Fictício", emergencyRelationship: "Irmã", emergencyPhone: "21988887777", registeredUnitId: CENTRO });
    expect(body).not.toHaveProperty("guardians");
    expect(onConfirm.mock.calls[0][0].id).toBe(created.id);
  });

  it("CA6: contato de emergência com só um campo pede os outros; os três vazios seguem sem contato", async () => {
    const user = userEvent.setup();
    capture();
    await setup({ ...adult, emergencyName: "Só o nome" });
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findAllByText("Informe nome, parentesco e telefone do contato, ou deixe os três em branco.")).not.toHaveLength(0);
    expect(body).toBeUndefined();
    await user.clear(screen.getByLabelText("Nome do contato"));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(body).toMatchObject({ emergencyName: null, emergencyRelationship: null, emergencyPhone: null });
  });

  it("CA7: CPF existente mostra só nome e situação, esconde o cadastro e confirma; CPF novo mantém o cadastro", async () => {
    const user = userEvent.setup();
    await setup();
    await user.type(screen.getByLabelText(/CPF do aluno/), NEW_CPF);
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Buscar" })).toBeEnabled());
    expect(screen.getByLabelText(/Nome completo/)).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/CPF do aluno/));
    await user.type(screen.getByLabelText(/CPF do aluno/), ADULT_CPF);
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText("Aluno Adulto Fictício")).toBeInTheDocument();
    expect(screen.getByText("Matrícula nova")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome completo/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "É este aluno, continuar" }));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ name: "Aluno Adulto Fictício" }));
  });

  it("CA7: CPF válido ainda não buscado: Continuar busca antes de cadastrar", async () => {
    const user = userEvent.setup();
    capture();
    await setup();
    await user.type(screen.getByLabelText(/CPF do aluno/), ADULT_CPF);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Aluno Adulto Fictício")).toBeInTheDocument();
    expect(body).toBeUndefined();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("CA8: nome e nascimento iguais a um aluno existente mostram o aviso, com as duas saídas", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/v1/students", () =>
        HttpResponse.json(
          { code: "STUDENT_POSSIBLE_DUPLICATE", message: "x", fields: [{ field: "id", message: "00000000-0000-0000-0000-000000000701" }, { field: "name", message: "Criança Igual" }, { field: "photoUrl", message: "" }] },
          { status: 409 },
        ),
      ),
    );
    await setup({ ...adult, cpf: "", birthDate: "2018-04-05", name: "Criança Igual" });
    await user.type(screen.getByLabelText("Nome do responsável"), "Mãe Fictícia");
    await user.type(screen.getByLabelText("CPF do responsável"), NEW_CPF);
    await user.type(screen.getByLabelText("E-mail do responsável"), "mae@exemplo.example");
    await user.type(screen.getByLabelText("Celular do responsável"), "21999990000");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText(/Já existe um aluno chamado Criança Igual/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar mesmo assim" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Usar o aluno existente" }));
    expect(await screen.findByText("Criança Igual")).toBeInTheDocument();
  });

  it("CA5: arquivo inválido mostra a mensagem; falha no envio da foto avisa e o assistente segue", async () => {
    const user = userEvent.setup({ applyAccept: false });
    capture();
    photo.mockRejectedValue(new Error("falhou"));
    await setup({ ...adult, photo: new Blob(["x"], { type: "image/png" }) });
    await user.upload(screen.getByLabelText("Arquivo da foto"), new File(["x"], "doc.pdf", { type: "application/pdf" }));
    expect(await screen.findByText("Use uma imagem PNG, JPG ou WebP.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ id: created.id }), true));
    expect(photo).toHaveBeenCalledWith(created.id, expect.any(Blob));
  });

  it("CA9: menor sem responsável mostra o aviso e desabilita Continuar; com responsável habilita; segundo responsável e financeira", async () => {
    const user = userEvent.setup();
    await setup({ ...adult, cpf: "", birthDate: "2018-04-05" });
    expect(screen.getByText("Menor de idade: vincule ao menos um responsável.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    expect(screen.getByLabelText(/CPF do aluno \(opcional para menor\)/)).toBeInTheDocument();
    await user.type(screen.getByLabelText("Nome do responsável"), "Mãe Fictícia");
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    expect(screen.queryByText("Menor de idade: vincule ao menos um responsável.")).toBeNull();
    await user.type(screen.getByLabelText("CPF do responsável"), ADULT_CPF);
    expect(screen.getByText("CPF ***.982.***-25")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Adicionar segundo responsável" }));
    expect(screen.getAllByLabelText("Nome do responsável")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Adicionar segundo responsável" })).toBeNull();
    const [first, second] = screen.getAllByRole("checkbox", { name: "Responsável financeira" });
    expect(first).toBeChecked();
    await user.click(second);
    expect(second).toBeChecked();
    expect(first).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Remover responsável" }));
    expect(screen.getAllByLabelText("Nome do responsável")).toHaveLength(1);
  });

  it("Cancelar volta à lista", async () => {
    const user = userEvent.setup();
    await setup();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
