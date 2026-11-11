import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { SessionProvider } from "@/features/auth/SessionProvider";
import { server } from "@/mocks/server";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { OtherClasses } from "../ModalityPickers";
import { StepModalities } from "./StepModalities";
import { newModality } from "./request";
import type { ModalityDraft } from "./types";

const ADULT_ID = "00000000-0000-0000-0000-000000000701";
const clean = (s: string | null) => (s ?? "").replace(/\u00a0/g, " ");

function Host() {
  const [m, setM] = useState<ModalityDraft[]>([newModality()]);
  return <StepModalities studentId={ADULT_ID} activeCount={0} takenModalityIds={new Set()} modalities={m} errors={{}} onChange={setM} />;
}

async function open() {
  await fetch("/api/v1/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "ana@exemplo.com", password: "segredo123" }) });
  server.use(http.get("/api/v1/units/:id/modalities", () => HttpResponse.json({ canManage: true, items: [{ id: "00000000-0000-0000-0000-000000000103", name: "Jiu-Jitsu", offered: true }] })));
  render(
    <ThemeProvider>
      <MemoryRouter>
        <SessionProvider>
          <Host />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
  const user = userEvent.setup();
  const pick = async (label: string, option: RegExp | string) => user.selectOptions(await screen.findByLabelText(label), await screen.findByRole("option", { name: option }));
  await pick("Unidade", /Centro/);
  await pick("Modalidade", "Jiu-Jitsu");
  await pick("Turma principal", "Jiu-Jitsu Adulto");
  await pick("Plano", /Jiu-Jitsu Livre/);
  return { user, pick };
}

describe("etapa 2: cartão da modalidade (CA10 a CA12)", () => {
  it("CA10: ponto de cor com o nome, lixeira com nome acessível e Outros horários em popover", async () => {
    await open();
    expect(screen.getByRole("heading", { name: "Jiu-Jitsu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover" })).toBeInTheDocument();
  });

  it("CA10: turma acima da capacidade mostra o banner âmbar e não bloqueia", async () => {
    server.use(http.get("/api/v1/students/:id/enrollment/class-warnings", () => HttpResponse.json({ studentAge: 30, ageRange: null, ageOutOfRange: false, capacity: 25, activeStudents: 25, overCapacity: true })));
    await open();
    expect(await screen.findByText("Turma acima da capacidade com esta matrícula: 26 de 25. Você pode seguir; a capacidade só avisa.")).toBeInTheDocument();
  });

  it("CA11 e CA12: benefício em porcentagem e em valor recalculam a mensalidade e pedem motivo e decisor", async () => {
    const { user, pick } = await open();
    expect(clean((await screen.findByText(/^Mensalidade:/)).textContent)).toBe("Mensalidade: R$ 200,00");
    await pick("Benefício (opcional)", "Bolsa em porcentagem");
    await user.type(screen.getByLabelText(/Porcentagem/), "10");
    expect(clean(screen.getByText(/^Mensalidade:/).textContent)).toBe("Mensalidade: R$ 200,00 − 10% = R$ 180,00");
    expect(screen.getByLabelText("Motivo")).toBeInTheDocument();
    expect(screen.getByLabelText("Decidido por")).toBeInTheDocument();
    await pick("Benefício (opcional)", "Desconto em valor");
    await user.type(screen.getByLabelText("Valor do desconto"), "2000");
    expect(clean(screen.getByText(/^Mensalidade:/).textContent)).toBe("Mensalidade: R$ 200,00 − R$ 20,00 = R$ 180,00");
    await pick("Benefício (opcional)", "Nenhum");
    expect(clean(screen.getByText(/^Mensalidade:/).textContent)).toBe("Mensalidade: R$ 200,00");
  });

  it("remover tira o cartão", async () => {
    const { user } = await open();
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(screen.queryByRole("heading", { name: "Jiu-Jitsu" })).toBeNull();
    expect(within(document.body).getByRole("button", { name: "Adicionar outra modalidade" })).toBeEnabled();
  });
});

describe("Outros horários em popover", () => {
  it("abre o bloco com as demais turmas e conta as marcadas", async () => {
    const user = userEvent.setup();
    const Wrap = () => {
      const [v, setV] = useState<string[]>([]);
      return <OtherClasses popover options={[{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }]} primary="a" value={v} onChange={setV} />;
    };
    render(<Wrap />);
    await user.click(screen.getByRole("button", { name: "Escolha" }));
    await user.click(within(screen.getByRole("dialog", { name: "Outros horários" })).getByLabelText("B"));
    expect(screen.getByRole("button", { name: "Selecionados: 1" })).toBeInTheDocument();
  });
});
