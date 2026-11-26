import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { PaymentProof } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAHnOcQAAAAABJRU5ErkJggg==";
const proof = (over: Partial<PaymentProof> = {}): PaymentProof => ({
  id: "p1", chargeId: "c1", studentId: "s1", studentName: "Ana Souza", studentPhotoUrl: null, unitId: "u1", unit: "Centro", reference: "Jiu-Jitsu · 03/2026", amountCents: 12000,
  dueOn: "2026-03-05", sentAt: "2026-03-06T15:00:00Z", status: "PENDING", contentType: "image/png", imageUrl: IMAGE, refusalReason: null, decidedAt: null, unitPixKey: "12.345.678/0002-90", ...over,
});
const two = [
  proof(),
  proof({ id: "p2", chargeId: "c2", studentName: "João Pereira", studentId: "s2", reference: "Kimono", amountCents: 9000, sentAt: "2026-03-07T15:00:00Z", contentType: "application/pdf", imageUrl: "https://files.example/p2.pdf" }),
];
// Um comprovante enviado de uma vez para duas cobranças do mesmo aluno (mesmo instante), mais um de outro aluno.
const SENT = "2026-10-08T11:12:00Z";
const pair = [
  proof({ id: "g1", chargeId: "c1", studentId: "s3", studentName: "Lucas Almeida", unit: "Barra", reference: "Jiu-Jitsu · 10/2026", amountCents: 19000, dueOn: "2026-10-10", sentAt: SENT }),
  proof({ id: "g2", chargeId: "c2", studentId: "s3", studentName: "Lucas Almeida", unit: "Barra", reference: "Muay Thai · 10/2026", amountCents: 17000, dueOn: "2026-10-10", sentAt: SENT }),
  proof({ id: "g3", chargeId: "c3", studentId: "s4", studentName: "Juliana Costa", reference: "Muay Thai · 10/2026", amountCents: 17000, sentAt: "2026-10-09T11:12:00Z" }),
];

let posts: { url: string; body: unknown }[];
let size: string | null;

function setup(list?: () => Response | Promise<Response>, role = "COORDINATOR") {
  posts = [];
  size = null;
  window.history.replaceState(null, "", "/cobrancas/conferencia");
  const decide = async ({ request }: { request: Request }) => {
    posts.push({ url: new URL(request.url).pathname, body: await request.json() });
    return HttpResponse.json(proof());
  };
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session(role))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions(role) })),
    http.get("/api/v1/payment-proofs", ({ request }) => {
      size = new URL(request.url).searchParams.get("size");
      return list ? list() : HttpResponse.json({ items: two, page: 1, size: 100, total: 2 });
    }),
    http.post("/api/v1/payment-proofs/:id/confirm", decide),
    http.post("/api/v1/payment-proofs/:id/refuse", decide),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={["/cobrancas/conferencia"]}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Em conferência", level: 1 });
const featured = () => screen.findByRole("region", { name: /em destaque/ });
const grouped = () => HttpResponse.json({ items: pair, page: 1, size: 100, total: 3 });

describe("PaymentProofsPage (RF-COB-05)", () => {
  it("CA8: o primeiro comprovante em destaque (imagem, valor, envio, chave da unidade, prazo pausado, aviso do extrato) e os demais em Também aguardando; pede size=100", async () => {
    setup();
    await ready();
    const box = within(await featured());
    expect(screen.queryByText(/Comprovantes de Pix na chave da unidade/)).toBeNull();
    expect(box.getByText("Centro · Jiu-Jitsu · mar/2026")).toBeInTheDocument();
    expect(box.getByRole("img", { name: "Comprovante de Ana Souza" })).toHaveAttribute("src", IMAGE);
    expect(box.getByText("Em conferência")).toBeInTheDocument();
    expect(box.getByText(/120,00/)).toBeInTheDocument();
    expect(box.getByText(/^06\/03\/2026 às \d{2}h\d{2} pelo portal$/)).toBeInTheDocument();
    expect(box.getByText("12.345.678/0002-90")).toBeInTheDocument();
    expect(box.getByText("pausado enquanto estiver em conferência")).toBeInTheDocument();
    expect(box.getByText("Confira no extrato do banco da Centro se o valor entrou antes de confirmar.")).toBeInTheDocument();
    expect(box.getByRole("button", { name: "Confirmar comprovante de Ana Souza" })).toHaveTextContent("Confirmar pagamento");
    const waiting = screen.getByRole("region", { name: "Também aguardando" });
    expect(within(waiting).getByText("João Pereira")).toBeInTheDocument();
    expect(within(waiting).getByText("Kimono")).toBeInTheDocument();
    expect(within(waiting).getByText("07/03")).toBeInTheDocument();
    expect(size).toBe("100");
  });

  it("CA9: comprovante sem imagem mostra Imagem indisponível e os botões continuam", async () => {
    setup(() => HttpResponse.json({ items: [proof({ imageUrl: null })], page: 1, size: 100, total: 1 }));
    const box = within(await featured());
    expect(box.getByText("Imagem indisponível")).toBeInTheDocument();
    expect(box.getByRole("button", { name: "Recusar comprovante de Ana Souza" })).toBeInTheDocument();
  });

  it("CA9: Confirmar oferece o recibo por e-mail (marcado) e recarrega a fila", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(within(await featured()).getByRole("button", { name: "Confirmar comprovante de Ana Souza" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirmar comprovante" });
    const box = within(dialog).getByRole("checkbox", { name: "Enviar o recibo por e-mail" });
    expect(box).toBeChecked();
    await user.click(box);
    await user.click(within(dialog).getByRole("button", { name: "Confirmar pagamento" }));
    await waitFor(() => expect(posts).toEqual([{ url: "/api/v1/payment-proofs/p1/confirm", body: { sendReceipt: false } }]));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA9: Recusar exige motivo de 3 caracteres e envia o texto", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(within(await featured()).getByRole("button", { name: "Recusar comprovante de Ana Souza" }));
    const dialog = await screen.findByRole("dialog", { name: "Recusar comprovante" });
    const submit = within(dialog).getByRole("button", { name: "Recusar comprovante" });
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Motivo da recusa/), "ab");
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Motivo da recusa/), "c  ");
    await user.click(submit);
    await waitFor(() => expect(posts).toEqual([{ url: "/api/v1/payment-proofs/p1/refuse", body: { reason: "abc" } }]));
  });

  it("CA9: erro do servidor na decisão aparece na janela e nada fecha", async () => {
    const user = userEvent.setup();
    setup();
    server.use(http.post("/api/v1/payment-proofs/:id/confirm", () => HttpResponse.json({ code: "PROOF_NOT_PENDING", message: "m", fields: [], traceId: "t" }, { status: 409 })));
    await user.click(within(await featured()).getByRole("button", { name: "Confirmar comprovante de Ana Souza" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirmar comprovante" });
    await user.click(within(dialog).getByRole("button", { name: "Confirmar pagamento" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("já foi decidido");
  });

  it("CA10: Também aguardando traz Conferir, que abre a janela do comprovante", async () => {
    const user = userEvent.setup();
    setup();
    await featured();
    await user.click(screen.getByRole("button", { name: "Conferir comprovante de João Pereira" }));
    const dialog = await screen.findByRole("dialog", { name: "Conferir comprovante" });
    expect(within(dialog).getByText("1 comprovante · 1 cobrança")).toBeInTheDocument();
    expect(within(dialog).getByText("Comprovante Pix · R$ 90,00")).toBeInTheDocument();
  });

  it("CA11, CA12: dois comprovantes do mesmo aluno no mesmo instante viram um item, e a janela decide cada cobrança uma a uma", async () => {
    const user = userEvent.setup();
    setup(grouped);
    await ready();
    await featured();
    const box = within(await featured());
    expect(box.getByText("Barra · Jiu-Jitsu e Muay Thai · out/2026")).toBeInTheDocument();
    expect(box.getByText(/360,00/)).toBeInTheDocument();
    await user.click(box.getByRole("button", { name: "Conferir comprovante de Lucas Almeida" }));
    const dialog = await screen.findByRole("dialog", { name: "Conferir comprovante" });
    expect(within(dialog).getByText("1 comprovante · 2 cobranças")).toBeInTheDocument();
    expect(within(dialog).getByText("Comprovante Pix · R$ 360,00")).toBeInTheDocument();
    expect(within(dialog).getAllByText("vence 10/10")).toHaveLength(2);
    // Confirma uma: a outra segue pendente e a janela fica aberta.
    await user.click(within(dialog).getByRole("button", { name: "Confirmar Jiu-Jitsu · out/2026" }));
    const confirm = await screen.findByRole("dialog", { name: "Confirmar comprovante" });
    await user.click(within(confirm).getByRole("button", { name: "Confirmar pagamento" }));
    await waitFor(() => expect(posts.map((x) => x.url)).toEqual(["/api/v1/payment-proofs/g1/confirm"]));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Confirmar comprovante" })).toBeNull());
    const still = screen.getByRole("dialog", { name: "Conferir comprovante" });
    expect(within(still).queryByRole("button", { name: "Confirmar Jiu-Jitsu · out/2026" })).toBeNull();
    expect(within(still).getByText("Decidida")).toBeInTheDocument();
    // Recusa a outra: pede o motivo e, sendo a última, a janela fecha.
    await user.click(within(still).getByRole("button", { name: "Recusar Muay Thai · out/2026" }));
    const refuse = await screen.findByRole("dialog", { name: "Recusar comprovante" });
    await user.type(within(refuse).getByLabelText(/Motivo da recusa/), "Valor diferente");
    await user.click(within(refuse).getByRole("button", { name: "Recusar comprovante" }));
    await waitFor(() => expect(posts.map((x) => x.url)).toEqual(["/api/v1/payment-proofs/g1/confirm", "/api/v1/payment-proofs/g2/refuse"]));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA12: Fechar fecha a janela sem decidir", async () => {
    const user = userEvent.setup();
    setup(grouped);
    await user.click(within(await featured()).getByRole("button", { name: "Conferir comprovante de Lucas Almeida" }));
    const dialog = await screen.findByRole("dialog", { name: "Conferir comprovante" });
    await user.click(within(dialog).getAllByRole("button", { name: "Fechar" }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(posts).toEqual([]);
  });

  it("CA29: vazio, erro com nova tentativa e sem permissão", async () => {
    const user = userEvent.setup();
    let fail = true;
    setup(() => (fail ? HttpResponse.json({ code: "X", message: "m", fields: [], traceId: "t" }, { status: 500 }) : HttpResponse.json({ items: [], page: 1, size: 100, total: 0 })));
    const retry = await waitFor(() => within(screen.getByRole("main")).getByRole("button", { name: "Tentar de novo" }));
    fail = false;
    await user.click(retry);
    expect(await screen.findByText("Nenhum comprovante em conferência")).toBeInTheDocument();
  });

  it("CA29: 403 do servidor mostra sem permissão", async () => {
    setup(() => HttpResponse.json({ code: "FORBIDDEN", message: "m", fields: [], traceId: "t" }, { status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA13: a 360 px a lista são os cartões do canvas (Comprovante, Confirmar e Recusar) e o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDeviceNarrow(true, dark);
      window.innerWidth = 360;
      const { container, unmount } = setup(grouped);
      await ready();
      await screen.findByText("Lucas Almeida");
      expect(screen.queryByText(/2 comprovantes/)).toBeNull();
      const cards = screen.getAllByRole("listitem").filter((li) => li.className.includes("rounded-md border p-3"));
      expect(cards).toHaveLength(2);
      expect(within(cards[0]).getByRole("link", { name: /Comprovante/ })).toHaveAttribute("href", IMAGE);
      expect(within(cards[0]).getByRole("button", { name: "Conferir comprovante de Lucas Almeida" })).toBeInTheDocument();
      expect(within(cards[1]).getByRole("button", { name: "Confirmar comprovante de Juliana Costa" })).toBeInTheDocument();
      expect(container.querySelector("table")).toBeNull();
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });

  it("a 1440 px o axe não acusa violação nos dois temas, com a janela de conferência aberta", async () => {
    const user = userEvent.setup();
    for (const dark of [false, true]) {
      setDeviceNarrow(false, dark);
      const { unmount } = setup(grouped);
      await user.click(within(await featured()).getByRole("button", { name: "Conferir comprovante de Lucas Almeida" }));
      await screen.findByRole("dialog", { name: "Conferir comprovante" });
      expect(await axeViolations(document.body)).toEqual([]);
      unmount();
    }
  });
});

describe("PaymentProofsPage: escopo de unidade da barra", () => {
  it("manda unitId da unidade escolhida e não manda com Todas as unidades", async () => {
    const seen: (string | null)[] = [];
    localStorage.setItem("ctcore.unitScope.l1", "u1");
    setup();
    server.use(
      http.get("/api/v1/units/reachable", () => HttpResponse.json({ allUnits: true, units: [{ id: "u1", name: "Centro" }, { id: "u2", name: "Barra" }] })),
      http.get("/api/v1/payment-proofs", ({ request }) => {
        seen.push(new URL(request.url).searchParams.get("unitId"));
        return HttpResponse.json({ items: two, page: 1, size: 100, total: 2 });
      }),
    );
    await ready();
    await waitFor(() => expect(seen).toContain("u1"));
    expect(seen).not.toContain(null);
    localStorage.removeItem("ctcore.unitScope.l1");
  });
});
