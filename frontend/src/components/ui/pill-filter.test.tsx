import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { FilterSheetContext } from "@/components/query/FilterSheet";
import { PillFilter } from "./pill-filter";

const OPTIONS = [
  { id: "m1", name: "Jiu-Jitsu" },
  { id: "m2", name: "Judô" },
];

function Harness({ onChange = () => {}, disabled }: { onChange?: (v: string) => void; disabled?: boolean }) {
  const [v, setV] = useState("");
  return (
    <>
      <PillFilter
        label="Modalidade"
        value={v}
        onChange={(x) => {
          setV(x);
          onChange(x);
        }}
        allLabel="Todas"
        options={OPTIONS}
        disabled={disabled}
      />
      <p>fora</p>
    </>
  );
}

describe("PillFilter", () => {
  it("CA2/CA3: mostra Todas, abre com a opção todas primeira e escolhe", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const btn = screen.getByRole("button", { name: "Modalidade Todas" });
    expect(btn).toHaveAttribute("aria-haspopup", "listbox");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(btn);
    const opts = screen.getAllByRole("option");
    expect(opts[0]).toHaveTextContent("Todas");
    expect(opts[0]).toHaveAttribute("aria-selected", "true");
    await userEvent.click(screen.getByRole("option", { name: "Jiu-Jitsu" }));
    expect(onChange).toHaveBeenCalledWith("m1");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("button", { name: "Modalidade Jiu-Jitsu" })).toHaveAttribute("data-active", "true");
  });

  it("CA4: Esc devolve o foco, clique fora fecha, setas e Enter escolhem", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const btn = screen.getByRole("button", { name: /Modalidade/ });
    await userEvent.click(btn);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(btn).toHaveFocus();
    await userEvent.click(btn);
    await userEvent.click(screen.getByText("fora"));
    expect(screen.queryByRole("listbox")).toBeNull();
    await userEvent.click(btn);
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onChange).toHaveBeenCalledWith("m2");
    expect(btn).toHaveFocus();
  });

  it("CA5: desabilitado não abre", async () => {
    render(<Harness disabled />);
    await userEvent.click(screen.getByRole("button", { name: /Modalidade/ }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("CA10: axe fechado e aberto", async () => {
    const { container } = render(<Harness />);
    expect(await axeViolations(container)).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: /Modalidade/ }));
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("PillFilter dentro da folha (CA8)", () => {
  it("vira campo com rótulo e seletor nativo; disabled e onChange valem", async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FilterSheetContext.Provider value>
        <PillFilter label="Modalidade" value="" onChange={onChange} allLabel="Todas" options={OPTIONS} />
      </FilterSheetContext.Provider>,
    );
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Modalidade" }), "m2");
    expect(onChange).toHaveBeenCalledWith("m2");
    rerender(
      <FilterSheetContext.Provider value>
        <PillFilter label="Nível" value="" onChange={onChange} allLabel="Todos" options={[]} disabled />
      </FilterSheetContext.Provider>,
    );
    expect(screen.getByRole("combobox", { name: "Nível" })).toBeDisabled();
  });
});
