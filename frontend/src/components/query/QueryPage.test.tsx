import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { setDeviceNarrow } from "@/test/device";
import { QueryPage, type Page, type Query } from "./QueryPage";

type Row = { id: string; nome: string };
const columns = [
  { key: "nome", label: "Nome", sortable: true, render: (r: Row) => r.nome },
];
const all: Row[] = Array.from({ length: 45 }, (_, i) => ({ id: String(i), nome: `Aluno ${i}` }));

function setup(fetchPage: (q: Query) => Promise<Page<Row>>, url = "/") {
  window.history.replaceState(null, "", url);
  return render(<QueryPage columns={columns} fetchPage={fetchPage} rowKey={(r) => r.id} />);
}
const pager = (q: Query) => Promise.resolve({ rows: all.slice((q.pagina - 1) * q.tamanho, q.pagina * q.tamanho), total: 45 });

describe("QueryPage", () => {
  it("CA6: com searchPlaceholder usa o SearchBox e grava q; sem ele a caixa de sempre", async () => {
    window.history.replaceState(null, "", "/");
    const { unmount } = render(<QueryPage columns={columns} fetchPage={pager} rowKey={(r) => r.id} searchPlaceholder="Nome" />);
    await screen.findByText("Aluno 0");
    const box = screen.getByRole("searchbox", { name: "Buscar" });
    expect(box).toHaveAttribute("placeholder", "Nome");
    await userEvent.type(box, "a");
    await waitFor(() => expect(window.location.search).toBe("?q=a"));
    unmount();
    setup(pager);
    expect(screen.getByRole("searchbox", { name: "Buscar" })).not.toHaveAttribute("placeholder");
  });

  it("CA5/CA7: lê o endereço, pede só a página atual e atualiza o endereço ao filtrar", async () => {
    const fetchPage = vi.fn(pager);
    setup(fetchPage, "/?q=ana&pagina=2&ordem=nome");
    expect(await screen.findByText("Aluno 25")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenLastCalledWith({ q: "ana", pagina: 2, ordem: "nome", filtros: {}, tamanho: 25 });
    expect(screen.getAllByRole("row")).toHaveLength(21);
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();
    expect(screen.getByText("45 resultados")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveValue("ana");

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar" }), "x");
    await waitFor(() => expect(window.location.search).toBe("?q=anax&ordem=nome"));
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ q: "anax", pagina: 1 }));
  });

  it("CA7: botões desabilitados nos extremos", async () => {
    setup(pager);
    await screen.findByText("Aluno 0");
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(await screen.findByText("Página 2 de 2")).toBeInTheDocument();
    expect(window.location.search).toBe("?pagina=2");
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
  });

  it.each([
    ["/", 25],
    ["/?tamanho=50", 50],
    ["/?tamanho=100", 100],
    ["/?tamanho=20", 25],
    ["/?tamanho=abc", 25],
  ])("RNF-02: %s pede páginas de %i, só 25, 50 ou 100 como no contrato", async (url, tamanho) => {
    const fetchPage = vi.fn(pager);
    setup(fetchPage, url);
    await screen.findByText("Aluno 0");
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ tamanho }));
    expect(screen.getByRole("combobox", { name: "Itens por página" })).toHaveValue(String(tamanho));
  });

  it("RNF-02: trocar o tamanho vai para o endereço e volta para a página 1", async () => {
    const fetchPage = vi.fn(pager);
    setup(fetchPage, "/?pagina=2");
    await screen.findByText("Aluno 25");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Itens por página" }), "50");
    expect(window.location.search).toBe("?tamanho=50");
    expect(await screen.findByText("Página 1 de 1")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1, tamanho: 50 }));

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Itens por página" }), "25");
    expect(window.location.search).toBe("");
  });

  it("RNF-02: mostra o total com separador de milhar e no singular", async () => {
    setup(() => Promise.resolve({ rows: all.slice(0, 25), total: 2000 }));
    expect(await screen.findByText("2.000 resultados")).toBeInTheDocument();
    setup(() => Promise.resolve({ rows: all.slice(0, 1), total: 1 }), "/?q=um");
    expect(await screen.findByText("1 resultado")).toBeInTheDocument();
  });

  it("ordenação vai para o endereço", async () => {
    setup(pager);
    await userEvent.click(await screen.findByRole("button", { name: "Ordenar por Nome" }));
    expect(window.location.search).toBe("?ordem=nome");
    await userEvent.click(await screen.findByRole("button", { name: "Ordenar por Nome" }));
    expect(window.location.search).toBe("?ordem=-nome");
  });

  it("CA6: parâmetros inválidos usam os padrões; página fora do intervalo volta para a 1", async () => {
    const fetchPage = vi.fn((q: Query) => (q.pagina > 3 ? Promise.resolve({ rows: [], total: 45 }) : pager(q)));
    setup(fetchPage, "/?pagina=abc&ordem=zzz");
    expect(await screen.findByText("Aluno 0")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1, ordem: "" }));

    window.history.replaceState(null, "", "/");
    setup(fetchPage, "/?pagina=99");
    await waitFor(() => expect(window.location.search).toBe(""));
    expect((await screen.findAllByText("Aluno 0")).length).toBeGreaterThan(0);
  });

  it("CA8: busca sem resultado com Limpar filtros; sem filtro mostra o vazio", async () => {
    setup(() => Promise.resolve({ rows: [], total: 0 }), "/?q=zzz");
    expect(await screen.findByText("Nenhum resultado")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(window.location.search).toBe("");
    expect(await screen.findByText("Nada por aqui ainda")).toBeInTheDocument();
  });

  it("erro com Tentar de novo e 403 sem permissão", async () => {
    const fetchPage = vi.fn().mockRejectedValueOnce(new Error("x")).mockImplementation(pager);
    setup(fetchPage);
    await userEvent.click(await screen.findByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Aluno 0")).toBeInTheDocument();

    setup(() => Promise.reject({ status: 403 }));
    expect(await screen.findByText("Você não tem acesso")).toBeInTheDocument();
  });
});

describe("QueryPage com canvasPagination (CA4, CA5)", () => {
  const rows131 = Array.from({ length: 131 }, (_, i) => ({ id: String(i), nome: `Aluno ${i}` }));
  const big = (q: Query) => Promise.resolve({ rows: rows131.slice((q.pagina - 1) * q.tamanho, q.pagina * q.tamanho), total: 131 });

  it("mostra o intervalo, navega e volta à página 1 ao trocar o tamanho", async () => {
    window.history.replaceState(null, "", "/");
    render(<QueryPage columns={columns} fetchPage={big} rowKey={(r) => r.id} canvasPagination />);
    expect(await screen.findByText("1–25 de 131")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(await screen.findByText("26–50 de 131")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox"), "50");
    expect(await screen.findByText("1–50 de 131")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox"), "25");
    window.history.replaceState(null, "", "/?pagina=6");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(await screen.findByText("126–131 de 131")).toBeInTheDocument();
  });

  it("sem a prop, a paginação atual continua", async () => {
    setup(big);
    expect(await screen.findByText("Página 1 de 6")).toBeInTheDocument();
    expect(screen.queryByText("1–25 de 131")).toBeNull();
  });
});

describe("QueryPage · cardsBelow", () => {
  const cards = (r: Row) => <span>Cartão {r.nome}</span>;
  const renderSm = (below?: "sm") => {
    window.history.replaceState(null, "", "/");
    render(<QueryPage columns={columns} fetchPage={pager} rowKey={(r) => r.id} cards={cards} cardsBelow={below} />);
  };
  afterEach(() => setDeviceNarrow(false));

  it("CA2: com \"sm\" abaixo de 640 px há cartões e nenhuma tabela", async () => {
    setDeviceNarrow(true);
    renderSm("sm");
    expect(await screen.findByText("Cartão Aluno 0")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("CA2: com \"sm\" a partir de 640 px há a tabela e nenhum cartão", async () => {
    setDeviceNarrow(false);
    renderSm("sm");
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("Cartão Aluno 0")).toBeNull();
  });

  it("CA2: sem cardsBelow vale o padrão atual (as duas no DOM, trocadas por CSS)", async () => {
    setDeviceNarrow(true);
    renderSm();
    expect(await screen.findByText("Cartão Aluno 0")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
