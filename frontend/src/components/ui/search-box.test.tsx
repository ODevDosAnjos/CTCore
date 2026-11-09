import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { SearchBox } from "./search-box";

describe("SearchBox (CA1)", () => {
  it("entrega o texto digitado e é achado como searchbox", async () => {
    const onChange = vi.fn();
    const { container } = render(<SearchBox value="ana" onChange={onChange} placeholder="Nome" />);
    const box = screen.getByRole("searchbox", { name: "Nome" });
    expect(box).toHaveValue("ana");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await userEvent.type(box, "s");
    expect(onChange).toHaveBeenCalledWith("anas");
    expect(await axeViolations(container)).toEqual([]);
  });
});
