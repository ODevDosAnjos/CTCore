import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { ModalityConfirmations } from "./ModalityConfirmations";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDevicePrefersDark } from "@/test/device";

const item = { modalityRowId: "m1", studentId: "s1", studentName: "Aluno Fictício", modality: "Judô", unit: "Centro", planId: "p1", plan: "Judô Mensal", planValueCents: 15000 };

describe("ModalityConfirmations (RN-MAT-13, CA9)", () => {
  it("abre sozinha com a tabela; Confirmar só depois da caixa; confirma e fecha", async () => {
    const posts: string[] = [];
    server.use(
      http.get("/api/v1/portal/modality-confirmations", () => HttpResponse.json([item])),
      http.post("/api/v1/portal/modality-confirmations/:id", ({ params }) => {
        posts.push(params.id as string);
        return HttpResponse.json({ modalityRowId: "m1", studentId: "s1", planId: "p1", planValueCents: 15000 }, { status: 201 });
      }),
    );
    render(<ModalityConfirmations />);
    const dialog = await screen.findByRole("dialog", { name: "Nova modalidade" });
    expect(within(dialog).queryByText("Não bloqueia o portal e não tem prazo.")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("columnheader", { name: "Mensalidade" })).toBeInTheDocument();
    expect(within(dialog).getByText("Judô Mensal")).toBeInTheDocument();
    expect(await axeViolations(dialog)).toEqual([]);
    const ok = within(dialog).getByRole("button", { name: "Confirmar" });
    expect(ok).toBeDisabled();
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Confirmo o plano e o valor" }));
    await userEvent.click(ok);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(posts).toEqual(["m1"]);
  });

  it("falha ao confirmar avisa e mantém a janela aberta", async () => {
    server.use(
      http.get("/api/v1/portal/modality-confirmations", () => HttpResponse.json([item])),
      http.post("/api/v1/portal/modality-confirmations/:id", () => new HttpResponse(null, { status: 500 })),
    );
    render(<ModalityConfirmations />);
    await userEvent.click(await screen.findByRole("checkbox", { name: "Confirmo o plano e o valor" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nada foi alterado");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Depois e Esc fecham sem chamar a confirmação", async () => {
    const posts: string[] = [];
    server.use(
      http.get("/api/v1/portal/modality-confirmations", () => HttpResponse.json([item])),
      http.post("/api/v1/portal/modality-confirmations/:id", ({ params }) => {
        posts.push(params.id as string);
        return new HttpResponse(null, { status: 201 });
      }),
    );
    const first = render(<ModalityConfirmations />);
    await userEvent.click(await screen.findByRole("button", { name: "Depois" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    first.unmount();
    render(<ModalityConfirmations />);
    await screen.findByRole("dialog");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(posts).toEqual([]);
  });

  it("sem pendência não abre", async () => {
    server.use(http.get("/api/v1/portal/modality-confirmations", () => HttpResponse.json([])));
    const { container } = render(<ModalityConfirmations />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ModalityConfirmations: falha da busca (RF-POR-08, CA6)", () => {
  it.each([false, true])("mostra erro com Tentar de novo e o botão refaz a busca, sem violações no axe (tema escuro: %s)", async (dark) => {
    setDevicePrefersDark(dark);
    let fail = true;
    server.use(http.get("/api/v1/portal/modality-confirmations", () => (fail ? new HttpResponse(null, { status: 500 }) : HttpResponse.json([item]))));
    const { container } = render(<ModalityConfirmations />);
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    expect(await axeViolations(container)).toEqual([]);
    fail = false;
    await userEvent.click(retry);
    expect(await screen.findByRole("dialog", { name: "Nova modalidade" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
  });
});
