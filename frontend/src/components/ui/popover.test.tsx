import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Popover } from "./popover";

const setup = () =>
  render(
    <>
      <p>fora</p>
      <Popover label="Avisos" trigger={(p) => <button {...p}>Sino</button>}>
        {(close) => <button onClick={close}>dentro</button>}
      </Popover>
    </>,
  );

it("CA2: aria-expanded, Esc devolve o foco, clique fora fecha e clique dentro não fecha", async () => {
  const user = userEvent.setup();
  setup();
  const button = screen.getByRole("button", { name: "Sino" });
  expect(button).toHaveAttribute("aria-expanded", "false");
  await user.click(button);
  expect(button).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("dialog", { name: "Avisos" })).toHaveFocus();
  await user.click(screen.getByRole("dialog"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(button).toHaveFocus();
  await user.click(button);
  await user.click(screen.getByText("fora"));
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(button);
  await user.click(screen.getByRole("button", { name: "dentro" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
