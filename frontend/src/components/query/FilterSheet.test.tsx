import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { PillFilter } from "@/components/ui/pill-filter";
import { axeViolations } from "@/test/axe";
import { setDeviceNarrow } from "@/test/device";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { QuickFilters } from "@/components/ui/quick-filters";
import { CanvasPagination } from "./Pagination";
import { FilterSheet } from "./FilterSheet";

const filters = <PillFilter label="Modalidade" value="" onChange={() => {}} allLabel="Todas" options={[{ id: "a", name: "Judô" }]} />;

afterEach(() => setDeviceNarrow(false));

describe("FilterSheet", () => {
  it("CA7: a partir de 640 px os filtros ficam na linha, sem botão Filtros", () => {
    setDeviceNarrow(false);
    render(<FilterSheet activeCount={0} resultsLabel="Ver 9 alunos" onClear={() => {}}>{filters}</FilterSheet>);
    expect(screen.queryByRole("button", { name: /^Filtros/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: /Modalidade/ })).toHaveLength(1);
  });

  it("CA6/CA8: abaixo de 640 px o botão abre a folha com campos, Ver N e Limpar; Esc e Ver fecham", async () => {
    setDeviceNarrow(true);
    const onClear = vi.fn();
    render(<FilterSheet activeCount={2} resultsLabel="Ver 9 alunos" onClear={onClear}>{filters}</FilterSheet>);
    expect(screen.queryByRole("combobox")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Filtros 2" }));
    expect(screen.getByRole("dialog", { name: "Filtros" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Modalidade" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onClear).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ver 9 alunos" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Filtros 2" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("axe (CA10)", () => {
  it.each([["claro", false], ["escuro", true]])("abas com soon, paginação e folha fechada e aberta no tema %s", async (_n, dark) => {
    setDeviceNarrow(true, dark);
    const { container } = render(
      <ThemeProvider>
        <QuickFilters value="a" onChange={() => {}} options={[{ key: "a", label: "Ativos", count: 3 }, { key: "b", label: "Bloqueados", soon: true }]} />
        <CanvasPagination page={1} pages={6} total={131} size={25} onPage={() => {}} onSize={() => {}} />
        <FilterSheet activeCount={0} resultsLabel="Ver 9 alunos" onClear={() => {}}>{filters}</FilterSheet>
      </ThemeProvider>,
    );
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(await axeViolations(document.body)).toEqual([]);
  });
});
