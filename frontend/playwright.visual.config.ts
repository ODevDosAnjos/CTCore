import { defineConfig, devices } from "@playwright/test";

// D1: config própria, fora do `playwright test` do e2e. Referências só do container do CI (D2).
export default defineConfig({
  testDir: "./visual",
  testMatch: "**/*.visual.ts",
  snapshotDir: "./visual/referencias",
  snapshotPathTemplate: "{snapshotDir}/{arg}{ext}",
  forbidOnly: !!process.env.CI,
  retries: 0,
  fullyParallel: true,
  // #528: no CI usa 3 workers (3 dos 4 vCPUs; um fica para o Vite). Com 2 workers o `visual` levou 10 min 8 s (D8). Fora do CI, o padrão do Playwright.
  workers: process.env.CI ? 3 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  expect: { toHaveScreenshot: { animations: "disabled", caret: "hide", maxDiffPixelRatio: 0.001 } },
  use: { baseURL: "http://localhost:5174", locale: "pt-BR", timezoneId: "America/Sao_Paulo", ...devices["Desktop Chrome"], channel: "chromium", launchOptions: { args: ["--lang=pt-BR"] } },
  projects: [{ name: "visual" }],
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
