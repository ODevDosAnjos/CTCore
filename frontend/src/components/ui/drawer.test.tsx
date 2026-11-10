import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Drawer } from "./drawer";

function Harness({ onChange }: { onChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Drawer
        open={open}
        onOpenChange={(v) => {
          onChange(v);
          setOpen(v);
        }}
        title="Jiu-Jitsu"
        eyebrow="Turma"
        footer={<button>Salvar</button>}
      >
        <p>corpo</p>
      </Drawer>
    </>
  );
}

it("CA1: diálogo com título como nome, rodapé, Esc e fechar chamam onOpenChange(false) e o foco volta ao botão", async () => {
  const user = userEvent.setup();
  const calls: boolean[] = [];
  render(<Harness onChange={(v) => calls.push(v)} />);
  const opener = screen.getByRole("button", { name: "Abrir" });
  await user.click(opener);
  const dialog = await screen.findByRole("dialog", { name: "Jiu-Jitsu" });
  expect(dialog).toHaveClass("sm:w-[min(560px,100%)]");
  expect(screen.getByRole("heading", { name: "Jiu-Jitsu" })).toHaveClass("uppercase");
  expect(screen.getByText("Turma")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Salvar" })).toBeVisible();
  await user.keyboard("{Escape}");
  expect(calls.at(-1)).toBe(false);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(opener).toHaveFocus();
  await user.click(opener);
  await user.click(await screen.findByRole("button", { name: "Fechar" }));
  expect(calls.at(-1)).toBe(false);
  expect(opener).toHaveFocus();
});
