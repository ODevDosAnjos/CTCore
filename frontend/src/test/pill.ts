import { screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";
import type { UserEvent } from "@testing-library/user-event";

/** Abre a pílula pelo rótulo ("Modalidade") e devolve a lista aberta. */
export async function openPill(user: UserEvent, label: string) {
  await user.click(within(screen.getByRole("search")).getByRole("button", { name: new RegExp(`^${label}`) }));
  return screen.getByRole("listbox", { name: label });
}

/** Escolhe uma opção de uma pílula pelo nome dela. */
export async function pickPill(user: UserEvent, label: string, option: string) {
  const list = await openPill(user, label);
  await user.click(within(list).getByRole("option", { name: option }));
}

/** Abre a pílula, espera as opções serem exatamente estas (os dados chegam depois) e deixa a lista aberta. */
export async function expectPillOptions(user: UserEvent, label: string, names: string[]) {
  const list = await openPill(user, label);
  await waitFor(() => expect(within(list).getAllByRole("option").map((o) => o.textContent)).toEqual(names));
}
