import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// CA6 (R6): cada peça que se move declara duração entre 150 e 250 ms (duration-150, duration-200 ou duration-250).
const PECAS = ["Modal.tsx", "ui/drawer.tsx", "ui/popover.tsx", "ui/toast.tsx", "layout/Sidebar.tsx", "layout/GroupFlyout.tsx", "layout/UserMenu.tsx", "layout/UnitMenu.tsx"];

describe("transições", () => {
  it.each(PECAS)("CA6: %s usa duração de 150 a 250 ms", (arquivo) => {
    const src = readFileSync(join(__dirname, arquivo), "utf8");
    const duracoes = [...src.matchAll(/duration-(\d+)/g)].map((m) => Number(m[1]));
    expect(duracoes.length).toBeGreaterThan(0);
    for (const d of duracoes) expect(d >= 150 && d <= 250).toBe(true);
  });
});
