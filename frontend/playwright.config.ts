import { defineConfig, devices } from "@playwright/test";

// D5: Chromium contra `npm run dev` (MSW ligado); sem back-end.
export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  // #519: os fluxos @critical longos (login, troca de vínculo, vários passos) levam 15 a 25 s com o servidor de desenvolvimento frio e a máquina carregada; 30 s estourava.
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:5173", reducedMotion: "reduce", trace: "retain-on-failure", locale: "pt-BR" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    env: { VITE_MSW_CENARIOS: "false" },
    reuseExistingServer: !process.env.CI,
  },
});
