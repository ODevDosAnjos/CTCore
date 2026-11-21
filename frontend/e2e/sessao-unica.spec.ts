import { expect, test } from "@playwright/test";

// RN-ACE-23: a sessão encerrada por outro aparelho volta ao login com o aviso, sem `next`, dentro da moldura do login.
// O MSW vive na página, então "outro aparelho" é simulado respondendo SESSION_REPLACED na próxima chamada da página (o back-end real é provado no SingleManagementSessionIT).
test("@critical sessão encerrada por outro aparelho leva ao login com o aviso", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("ana@exemplo.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { name: "Bem-vindo ao ctcore" })).toBeVisible();

  await page.evaluate(() => {
    const original = globalThis.fetch;
    globalThis.fetch = async (...args) => {
      const url = String(args[0] instanceof Request ? args[0].url : args[0]);
      if (!url.includes("/api/v1/")) return original(...args);
      const body = { code: "SESSION_REPLACED", message: "m", changed: false, fields: [], traceId: "t" };
      return new Response(JSON.stringify(body), { status: 401, headers: { "Content-Type": "application/json" } });
    };
  });
  await page.evaluate('history.pushState({}, "", "/conta"); dispatchEvent(new PopStateEvent("popstate"))');

  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole("alert")).toHaveText("Sua sessão foi encerrada porque esta conta entrou em outro aparelho.");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});
