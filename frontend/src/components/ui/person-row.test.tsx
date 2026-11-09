import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./avatar";
import { PersonRow } from "./person-row";

describe("PersonRow", () => {
  it("mostra avatar, nome, secundário, selos e ação, com a ação por último", () => {
    const { container } = render(<PersonRow name="Ana Souza" secondary="12 anos" badges={<i>selo</i>} action={<button>zap</button>} />);
    const text = container.textContent;
    expect(text).toBe("ASAna Souzaselo12 anoszap");
    expect(container.querySelector("button")!.parentElement).toBe(container.firstElementChild!.lastElementChild);
  });

  it("renderiza sem secundário, selos e ação, e com title no lugar do nome", () => {
    const { container } = render(<PersonRow name="Ana Souza" title={<a href="/x">abrir</a>} />);
    expect(container.querySelector("p")).toBeNull();
    expect(screen.getByRole("link", { name: "abrir" })).toBeInTheDocument();
    expect(screen.queryByText("Ana Souza")).toBeNull();
    expect(container.querySelector("[data-tone]")).toBeInTheDocument();
  });

  it("usa a foto com alt vazio e quebra nome longo", () => {
    const { container } = render(<PersonRow name={"A".repeat(80)} photoUrl="/f.png" />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("alt", "");
    expect(container.querySelector("[data-tone]")).toBeNull();
    expect(container.firstElementChild).toHaveClass("min-w-0");
    expect(screen.getByText("A".repeat(80))).toHaveClass("break-words");
  });

  it("dá o mesmo tom ao mesmo nome", () => {
    const { container } = render(
      <>
        <PersonRow name="Bia Lima" />
        <Avatar name="Bia Lima" />
      </>,
    );
    const tones = [...container.querySelectorAll("[data-tone]")].map((e) => e.getAttribute("data-tone"));
    expect(tones[0]).toBe(tones[1]);
  });
});
