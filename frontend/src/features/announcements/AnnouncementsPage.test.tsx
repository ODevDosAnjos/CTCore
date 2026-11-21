import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router";
import { App } from "@/App";
import { SessionProvider, type SessionView } from "@/features/auth/SessionProvider";
import { mockPermissions } from "@/mocks/permissions";
import { server } from "@/mocks/server";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow, setDevicePrefersDark } from "@/test/device";
import { currentLocation, LocationProbe } from "@/test/location";
import { ThemeProvider } from "@/theme/ThemeProvider";
import type { AnnouncementItem } from "./types";

const session = (role: string): SessionView => ({
  account: { id: "a", email: "x@x.com", name: "X" },
  links: [{ id: "l1", organizationId: "o", organizationName: "Alfa", role, unitIds: [] }],
  activeLinkId: "l1",
  twoFactor: { enabled: false, required: false },
});
const item = (over: Partial<AnnouncementItem> = {}): AnnouncementItem => ({
  id: "a1",
  date: "2026-10-20T13:00:00Z",
  target: { kind: "CLASS", id: "k1", name: "Jiu-Jitsu Adulto" },
  title: "Aula de sexta cancelada",
  type: "CANCELED_CLASS",
  author: "Ana",
  status: "SENT",
  recipients: 12,
  reads: 5,
  pinnedUntil: null,
  estimatedRecipients: null,
  ...over,
});
const two = [
  item(),
  item({ id: "a2", date: "2026-11-02T12:00:00Z", target: { kind: "ORGANIZATION", id: null, name: null }, title: "Recesso de fim de ano", type: "GENERAL", status: "SCHEDULED", recipients: null, reads: 0 }),
];

let calls: URLSearchParams[];
let deletes: string[];

const TIJUCA = { id: "u1", name: "Tijuca", shortName: "Tij" };
let used = 0;

function setup(list?: (p: URLSearchParams) => Response | Promise<Response>, path = "/comunicados", remove?: () => Response, withUnit = false) {
  calls = [];
  deletes = [];
  server.use(
    http.get("/api/v1/auth/session", () => HttpResponse.json(session("COORDINATOR"))),
    http.get("/api/v1/permissions", () => HttpResponse.json({ permissions: mockPermissions("COORDINATOR") })),
    http.get("/api/v1/units/reachable", () => HttpResponse.json(withUnit ? { allUnits: false, units: [TIJUCA] } : { allUnits: true, units: [] })),
    http.get("/api/v1/announcements/daily-limit", () => HttpResponse.json({ unit: { id: "u1", name: "Tijuca", used, limit: 20 }, organization: null })),
    http.get("/api/v1/age-ranges", () => HttpResponse.json({ canManage: false, items: [] })),
    http.get("/api/v1/modalities", () => HttpResponse.json([])),
    http.get("/api/v1/classes", () => HttpResponse.json({ items: [{ id: "k1", name: "Jiu-Jitsu Adulto" }], page: 1, size: 100, total: 1 })),
    http.get("/api/v1/announcements", ({ request }) => {
      const p = new URL(request.url).searchParams;
      calls.push(p);
      return list ? list(p) : HttpResponse.json({ items: two, page: 1, size: 25, total: 2 });
    }),
    http.delete("/api/v1/announcements/:id", ({ params }) => {
      deletes.push(params.id as string);
      return remove ? remove() : new HttpResponse(null, { status: 204 });
    }),
  );
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <LocationProbe />
        <SessionProvider>
          <App />
        </SessionProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

const ready = () => screen.findByRole("heading", { name: "Comunicados", level: 1 });
const tableRow = (name: string) => screen.getAllByText(name).map((e) => e.closest("tr")).find(Boolean)!;
const failure = (status: number, code: string) => HttpResponse.json({ code, message: "m", fields: [], traceId: "t" }, { status });

afterEach(() => {
  used = 0;
  setDeviceNarrow(false);
});

describe("AnnouncementsPage (RF-COM-01)", () => {
  it("CA11: mostra data, destino, título, tipo, autor, situação, destinatários e lidos; no agendado, traços; pede data decrescente", async () => {
    setup();
    await ready();
    await screen.findAllByText("Aula de sexta cancelada");
    const sent = tableRow("Aula de sexta cancelada");
    expect(within(sent).getByText("20/10 · 10h00")).toBeInTheDocument();
    expect(within(sent).getByText("Turma · Jiu-Jitsu Adulto")).toBeInTheDocument();
    expect(within(sent).getByText("Aula cancelada")).toBeInTheDocument();
    expect(within(sent).getByText("Ana")).toBeInTheDocument();
    expect(within(sent).getByText("Enviado")).toBeInTheDocument();
    expect(within(sent).getByText("12")).toBeInTheDocument();
    expect(within(sent).getByText("5 (42%)")).toBeInTheDocument();
    const scheduled = tableRow("Recesso de fim de ano");
    expect(within(scheduled).getByText("Todas as unidades")).toBeInTheDocument();
    expect(within(scheduled).getByText("Agendado")).toBeInTheDocument();
    expect(within(scheduled).getByText("agendado 02/11")).toBeInTheDocument();
    expect(within(scheduled).getAllByText("—")).toHaveLength(2);
    expect(calls.at(-1)!.get("sort")).toBe("date,desc");
    expect(screen.getAllByRole("link", { name: "Novo comunicado" })[0]).toHaveAttribute("href", "/comunicados/novo");
  });

  it("CA11: a ação de cancelar só existe na linha agendada", async () => {
    setup();
    await ready();
    await screen.findAllByText("Aula de sexta cancelada");
    expect(within(tableRow("Aula de sexta cancelada")).queryByRole("button", { name: /Cancelar/ })).toBeNull();
    const scheduled = tableRow("Recesso de fim de ano");
    expect(within(scheduled).getByRole("button", { name: "Cancelar o agendamento de Recesso de fim de ano" })).toHaveTextContent("Cancelar");
    expect(within(scheduled).getByRole("link", { name: "Editar" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("columnheader", { name: "Ações" })).toBeNull();
  });

  it("CA1: o menu mostra Comunicados ativo e a barra, a trilha Comunicação › Comunicados", async () => {
    setup();
    await ready();
    expect(within(screen.getByRole("navigation", { name: "Menu principal", hidden: true })).getByRole("link", { name: "Comunicados", hidden: true })).toHaveAttribute("aria-current", "page");
    const trilha = screen.getByRole("navigation", { name: "Você está em" });
    expect(within(trilha).getByText("Comunicação")).toBeInTheDocument();
    expect(within(trilha).getByText("Comunicados")).toHaveAttribute("aria-current", "page");
  });

  it("CA2, CA3: subtítulo e botão com + do canvas, sem busca e sem data nativa solta; nota do rodapé e Fixado até", async () => {
    setup(() => HttpResponse.json({ items: [item({ pinnedUntil: "2026-10-17" }), two[1]], page: 1, size: 25, total: 2 }), "/comunicados", undefined, true);
    await ready();
    expect(await screen.findByText("Unidade Tijuca · o aluno lê no portal e por e-mail; não responde · limite de 20 por dia")).toBeInTheDocument();
    await screen.findAllByText("Aula de sexta cancelada");
    expect(within(tableRow("Aula de sexta cancelada")).getByText("Fixado até 17/10")).toBeInTheDocument();
    expect(screen.getByText(/Enviado não é editado nem apagado/)).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(document.querySelector('input[type="date"]')).toBeNull();
    expect(screen.queryByText("Itens por página")).toBeNull();
    expect(screen.getByRole("button", { name: /Período/ })).toHaveTextContent("Últimos 30 dias");
    expect(calls.at(-1)!.get("from")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(calls.at(-1)!.get("to")).toBeNull();
  });

  it("CA8: com 20 de 20 a faixa amarela aparece e o botão fica desabilitado; com menos, o subtítulo mostra N de 20", async () => {
    used = 20;
    const { unmount } = setup(undefined, "/comunicados", undefined, true);
    await ready();
    expect(await screen.findByText(/A Tijuca chegou a 20 comunicados hoje/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Novo comunicado/ });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByRole("link", { name: "Novo comunicado" })).toBeNull();
    unmount();
    used = 3;
    setup(undefined, "/comunicados", undefined, true);
    await ready();
    expect(await screen.findByText("Tijuca · 3 de 20 enviados hoje")).toBeInTheDocument();
    expect(screen.queryByText(/chegou a 20/)).toBeNull();
    expect(screen.getAllByRole("link", { name: "Novo comunicado" })[0]).toBeInTheDocument();
  });

  it("CA8: cancelar um agendado de hoje volta o botão e some a faixa", async () => {
    const user = userEvent.setup();
    used = 20;
    setup(
      undefined,
      "/comunicados",
      () => {
        used = 19;
        return new HttpResponse(null, { status: 204 });
      },
      true,
    );
    await ready();
    await screen.findByText(/A Tijuca chegou a 20 comunicados hoje/);
    await screen.findAllByText("Recesso de fim de ano");
    await user.click(within(tableRow("Recesso de fim de ano")).getByRole("button", { name: /Cancelar o agendamento/ }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar comunicado" }));
    await waitFor(() => expect(screen.queryByText(/chegou a 20/)).toBeNull());
    expect(await screen.findByText("Tijuca · 19 de 20 enviados hoje")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Novo comunicado" })[0]).toBeInTheDocument();
  });

  it("CA11: os filtros de período, turma e tipo vão para o endereço e para a consulta", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await screen.findAllByText("Aula de sexta cancelada");
    await user.click(screen.getByRole("button", { name: /^Tipo Todos/ }));
    await user.click(screen.getByRole("option", { name: "Aviso geral" }));
    await waitFor(() => expect(calls.at(-1)!.get("type")).toBe("GENERAL"));
    await user.click(screen.getByRole("button", { name: /^Turma Todas/ }));
    await user.click(await screen.findByRole("option", { name: "Jiu-Jitsu Adulto" }));
    await waitFor(() => expect(calls.at(-1)!.get("classId")).toBe("k1"));
    await user.click(screen.getByRole("button", { name: /Período/ }));
    await user.type(screen.getByLabelText("De"), "2026-10-01");
    await user.type(screen.getByLabelText("Até"), "2026-10-31");
    await waitFor(() => expect(calls.at(-1)!.get("from")).toBe("2026-10-01"));
    await waitFor(() => expect(calls.at(-1)!.get("to")).toBe("2026-10-31"));
    expect(currentLocation().search).toContain("type=GENERAL");
    expect(currentLocation().search).toContain("classId=k1");
  });

  it("CA11: confirmar o cancelamento chama o DELETE e recarrega a lista", async () => {
    const user = userEvent.setup();
    setup();
    await ready();
    await screen.findAllByText("Recesso de fim de ano");
    const before = calls.length;
    await user.click(within(tableRow("Recesso de fim de ano")).getByRole("button", { name: /Cancelar o agendamento/ }));
    const dialog = await screen.findByRole("dialog", { name: "Cancelar comunicado agendado" });
    expect(within(dialog).getByText("O comunicado agendado é apagado e não será enviado. A vaga do limite diário volta.")).toBeInTheDocument();
    expect(within(dialog).getByText("Resumo")).toBeInTheDocument();
    expect(within(dialog).getByText(/"Recesso de fim de ano" · agendado para 02\/11 às 09h00/)).toBeInTheDocument();
    expect(within(dialog).getByText("Todas as unidades")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar comunicado" }));
    await waitFor(() => expect(deletes).toEqual(["a2"]));
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("CA11: o 409 mostra o erro e a linha continua; manter fecha sem chamar o servidor", async () => {
    const user = userEvent.setup();
    setup(undefined, "/comunicados", () => failure(409, "ANNOUNCEMENT_ALREADY_SENT"));
    await ready();
    await screen.findAllByText("Recesso de fim de ano");
    const before = calls.length;
    await user.click(within(tableRow("Recesso de fim de ano")).getByRole("button", { name: /Cancelar o agendamento/ }));
    const dialog = await screen.findByRole("dialog", { name: "Cancelar comunicado agendado" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar comunicado" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("já foi enviado");
    expect(calls.length).toBe(before);
    expect(screen.getAllByText("Recesso de fim de ano").length).toBeGreaterThan(0);
    await user.click(within(dialog).getByRole("button", { name: "Voltar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(deletes).toEqual(["a2"]);
  });

  it("CA11: 404 no cancelamento (já apagado) fecha a janela e recarrega; 403 e outros erros ficam na janela", async () => {
    const user = userEvent.setup();
    let status = 404;
    setup(undefined, "/comunicados", () => failure(status, status === 403 ? "FORBIDDEN" : "NOT_FOUND"));
    await ready();
    await screen.findAllByText("Recesso de fim de ano");
    const open = () => user.click(within(tableRow("Recesso de fim de ano")).getByRole("button", { name: /Cancelar o agendamento/ }));
    const before = calls.length;
    await open();
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancelar comunicado" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(calls.length).toBeGreaterThan(before));
    status = 403;
    await screen.findAllByText("Recesso de fim de ano");
    await open();
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar comunicado" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Você não pode cancelar");
    status = 500;
    await user.click(within(dialog).getByRole("button", { name: "Cancelar comunicado" }));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("Não foi possível cancelar"));
  });

  it("CA12: carregando, depois vazio sem filtro com o botão Novo comunicado", async () => {
    setup(() => HttpResponse.json({ items: [], page: 1, size: 25, total: 0 }));
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(await screen.findByText("Nenhum comunicado ainda")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Novo comunicado" })).toHaveLength(2);
  });

  it("CA12: vazio com filtro mostra a diferença e Limpar filtros", async () => {
    const user = userEvent.setup();
    setup((p) => HttpResponse.json({ items: p.get("type") ? [] : two, page: 1, size: 25, total: p.get("type") ? 0 : 2 }), "/comunicados?type=GENERAL");
    expect(await screen.findByText("Nenhum comunicado com estes filtros")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await screen.findAllByText("Aula de sexta cancelada");
    expect(currentLocation().search).not.toContain("type=");
  });

  it("CA12: erro com tentar de novo e 403 do servidor mostra sem permissão", async () => {
    const user = userEvent.setup();
    let mode: "error" | "ok" = "error";
    const { unmount } = setup(() => (mode === "error" ? failure(500, "X") : HttpResponse.json({ items: two, page: 1, size: 25, total: 2 })));
    const retry = await screen.findByRole("button", { name: "Tentar de novo" });
    mode = "ok";
    await user.click(retry);
    await screen.findAllByText("Aula de sexta cancelada");
    unmount();
    setup(() => failure(403, "FORBIDDEN"));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });

  it("CA17: no celular há botão largo com +, subtítulo curto, sem filtros e a janela abre pelo cartão", async () => {
    const user = userEvent.setup();
    used = 3;
    setDeviceNarrow(true);
    setup(undefined, "/comunicados", undefined, true);
    await ready();
    expect(await screen.findByText("Tijuca · 3 de 20 hoje")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Período/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Tipo Todos/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Novo comunicado" }).className).toContain("w-full");
    await screen.findAllByText("Recesso de fim de ano");
    const card = screen.getAllByRole("listitem").find((li) => li.className.includes("rounded-md border p-3") && li.textContent?.includes("Recesso"))!;
    await user.click(within(card).getByRole("button", { name: /Cancelar o agendamento/ }));
    expect(await screen.findByRole("dialog", { name: "Cancelar comunicado agendado" })).toBeInTheDocument();
  });

  it("CA12: a 360 px as linhas viram cartões e o axe não acusa violação nos dois temas", async () => {
    for (const dark of [false, true]) {
      setDevicePrefersDark(dark);
      window.innerWidth = 360;
      const { container, unmount } = setup();
      await ready();
      await screen.findAllByText("Aula de sexta cancelada");
      const cards = screen.getAllByRole("listitem").filter((li) => li.className.includes("rounded-md border p-3"));
      expect(cards).toHaveLength(2);
      expect(within(cards[1]).getByRole("button", { name: /Cancelar o agendamento/ })).toBeInTheDocument();
      expect(within(cards[0]).getByText("Jiu-Jitsu Adulto · 20/10 · 5 de 12 leram")).toBeInTheDocument();
      expect(await axeViolations(container)).toEqual([]);
      unmount();
    }
  });
});
