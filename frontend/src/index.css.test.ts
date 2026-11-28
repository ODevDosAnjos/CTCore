import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// CA7 (RNF-20): rolagem suave e corte total do movimento com "reduzir movimento".
const css = readFileSync(join(__dirname, "index.css"), "utf8");
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));

describe("index.css: movimento", () => {
  it("CA7: rolagem suave sem a preferência", () => {
    expect(css).toMatch(/html\s*\{\s*scroll-behavior:\s*smooth;/);
  });
  it("CA7: com reduzir movimento, duração e atraso nulos e rolagem automática", () => {
    for (const p of ["animation-duration: 0s", "animation-delay: 0s", "transition-duration: 0s", "transition-delay: 0s", "scroll-behavior: auto"]) expect(reduced).toContain(p);
  });
});
