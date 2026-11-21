import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk("src/features").filter((f) => /Page\.tsx$/.test(f));
const read = (f: string) => readFileSync(f, "utf8");

// RNF-56 (#677): a moldura é a rota-pai (ManagementShell/PortalShell/RoleShell); nenhuma tela a monta. O AuthShell só vale nas telas de acesso (D2).
const FRAME = "ManagementLayout|ManagementShell|PortalLayout|PortalShell";
const PARENTS = /features\/(permissions\/ManagementShell|portal\/PortalShell|auth\/RoleShell)\.tsx$/;
export function violaMoldura(caminho: string, texto: string): boolean {
  const f = caminho.split(sep).join("/");
  if (PARENTS.test(f)) return false;
  const names = f.includes("features/auth/") ? FRAME : `${FRAME}|AuthShell`;
  return new RegExp(`^\\s*import\\s.*\\b(?:${names})\\b|<(?:${names})\\b`, "m").test(texto);
}

const screens = walk("src/features").filter((f) => /\.tsx$/.test(f) && !/\.test\.tsx$/.test(f));

describe("moldura fixa na rota (CA9, RNF-56)", () => {
  it("encontra as páginas", () => {
    expect(pages.length).toBeGreaterThanOrEqual(45);
  });

  it.each(screens)("%s não importa nem monta a moldura", (f) => {
    expect(violaMoldura(f, read(f))).toBe(false);
  });

  it("CA3: reprova tela que importa a moldura", () => {
    expect(violaMoldura("src/features/x/FooPage.tsx", 'import { ManagementLayout } from "@/a";')).toBe(true);
    expect(violaMoldura("src/features/x/FooPage.tsx", "return <PortalShell><x /></PortalShell>;")).toBe(true);
    expect(violaMoldura("src/features/x/FooPage.tsx", 'import { AuthShell } from "@/components/layout/AuthShell";')).toBe(true);
    expect(violaMoldura("src/features/auth/LoginPage.tsx", 'import { AuthShell } from "@/components/layout/AuthShell";')).toBe(false);
    expect(violaMoldura("src/features/auth/LoginPage.tsx", 'import { PortalShell } from "@/a";')).toBe(true);
    expect(violaMoldura("src/features/permissions/ManagementShell.tsx", 'import { ManagementLayout } from "@/a";')).toBe(false);
    expect(violaMoldura("src/features/x/FooPage.tsx", 'import type { PortalShellData } from "./usePortalShell";')).toBe(false);
  });
});

// Telas da gestão (CA8 da #417): o título vem do PageHeader. Ficam de fora as telas de acesso, a pública, o portal (portalPages.test.ts) e as gavetas
// sobre a lista (painel da turma, do professor e da aula, e a ficha do Professor, #470 e #472): quem tem o título é a lista.
describe("telas da gestão (CA8)", () => {
  const management = pages.filter((f) => !new RegExp("features/(auth|payments|portal)/|(Class|Teacher|Charge)PanelPage|LessonPanelPage|TeacherRecordPage").test(f.split(sep).join("/")));
  it("encontra as telas da gestão", () => {
    expect(management.length).toBeGreaterThanOrEqual(25);
  });

  it.each(management)("%s usa PageHeader e nenhum <h1 próprio", (f) => {
    expect(read(f)).not.toContain("<h1");
    expect(read(f)).toContain("<PageHeader");
  });
});
