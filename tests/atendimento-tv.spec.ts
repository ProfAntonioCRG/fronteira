import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function mockSpeech(context: BrowserContext) {
  await context.addInitScript(() => {
    const target = window as unknown as { spoken: string[]; printCount: number };
    target.spoken = []; target.printCount = 0;
    window.print = () => { target.printCount++; };
    class Utterance {
      text: string;
      onend?: () => void;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: Utterance, configurable: true });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      getVoices: () => [{ lang: "pt-BR", localService: true, name: "Portuguese test voice" }],
      addEventListener() {}, removeEventListener() {}, cancel() {}, resume() {},
      speak(utterance: Utterance) { target.spoken.push(utterance.text); setTimeout(() => utterance.onend?.(), 20); },
    } });
  });
}

async function readOrders(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("fronteira_orders_v1") || "[]") as { id: string; number: number; customer: string; status: string; callCount: number }[]);
}

async function createOrder(page: Page, customer = "", print = false) {
  await page.locator("#order-customer").fill(customer);
  await page.getByTitle("Toque para adicionar").first().click();
  await page.getByRole("button", { name: "Revisar e confirmar", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Conferir pedido antes de confirmar" })).toContainText(customer.trim() || "Cliente");
  await page.getByRole("button", { name: print ? "Confirmar e imprimir" : "Confirmar sem imprimir", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Pedido confirmado", exact: true })).toBeVisible();
}

async function openTv(page: Page) {
  const popup = page.waitForEvent("popup");
  await page.locator(".app-sidebar").getByRole("button", { name: /^Painel da TV/ }).click();
  const tv = await popup;
  await tv.waitForLoadState("domcontentloaded");
  await expect(tv.locator(".tv-screen")).toBeVisible();
  await expect(page.locator(".sidebar-panel-status")).toContainText("TV conectada");
  return tv;
}

async function showOrders(page: Page) {
  await page.locator(".app-sidebar").getByRole("button", { name: /^Pedidos/ }).click();
}

test.beforeEach(async ({ context }) => {
  await context.route("https://images.pexels.com/**", route => route.abort());
  await mockSpeech(context);
});

test("new orders appear in preparation; ready and repeated calls display and speak the name and number", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const tv = await openTv(page);
  tv.on("pageerror", error => errors.push(error.message));
  await tv.getByRole("button", { name: "Ativar som e voz", exact: true }).click();
  await createOrder(page, "  Maria Silva  ");
  await page.getByRole("button", { name: "Fechar confirmação do pedido", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Revisar e confirmar", exact: true })).toBeDisabled();
  await expect(tv.locator(".tv-received-order")).toContainText("Pedido recebido");
  await expect(tv.locator(".tv-received-order")).toContainText("001");
  await expect(tv.locator(".tv-received-order")).toContainText("Maria Silva");
  expect(await tv.evaluate(() => (window as unknown as { spoken: string[] }).spoken.some(text => text.startsWith("Pedido número 1.")))).toBe(false);
  await showOrders(page);
  await page.getByRole("button", { name: "Pronto e chamar", exact: true }).click();
  await expect(tv.locator(".tv-current")).toContainText("Pedido pronto");
  await expect(tv.locator(".tv-current .tv-customer-name")).toHaveText("Maria Silva");
  await expect(page.getByRole("status")).toContainText("A TV recebeu a chamada 1");
  await expect.poll(() => tv.evaluate(() => (window as unknown as { spoken: string[] }).spoken.filter(text => text.startsWith("Pedido número 1.")).length)).toBe(1);
  await page.getByRole("button", { name: /Chamar novamente/ }).click();
  await expect(page.getByRole("status")).toContainText("A TV recebeu a chamada 2");
  await expect.poll(() => tv.evaluate(() => (window as unknown as { spoken: string[] }).spoken.filter(text => text.startsWith("Pedido número 1.")).length)).toBe(2);
  expect((await readOrders(page))[0]).toMatchObject({ customer: "Maria Silva", callCount: 2, status: "pronto" });
  await expect(tv.locator(".tv-last-calls")).toContainText("Maria Silva");
  await tv.screenshot({ path: "test-results/tv-call.png" });
  await page.getByRole("button", { name: "Marcar como entregue", exact: true }).click();
  await expect(tv.locator(".tv-current")).not.toContainText("Maria Silva");
  await expect(tv.locator(".tv-last-calls")).not.toContainText("Maria Silva");
  expect(errors).toEqual([]);
});

test("Cliente fallback, close/back/Escape, reprinting and editable names never duplicate an order", async ({ page }) => {
  await page.goto("/");
  const tv = await openTv(page);
  const printed = page.waitForEvent("popup");
  await createOrder(page, "   ", true);
  const receipt = await printed;
  await expect(receipt.locator("body")).toContainText("Cliente");
  await expect.poll(() => receipt.evaluate(() => (window as unknown as { printCount: number }).printCount)).toBe(1);
  await receipt.close();
  await page.getByRole("button", { name: "Voltar ao atendimento", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await readOrders(page)).toHaveLength(1);
  const reprinted = page.waitForEvent("popup");
  await page.locator(".last-confirmed-order").getByRole("button", { name: "Reimprimir", exact: true }).click();
  const copy = await reprinted;
  await expect(copy.locator("h2")).toHaveText("Nº 001");
  await copy.close();
  expect(await readOrders(page)).toHaveLength(1);
  await createOrder(page, "João");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await readOrders(page)).toHaveLength(2);
  await showOrders(page);
  const original = page.locator(".orders-board-grid article").filter({ hasText: "Nº 001" });
  await original.getByTitle("Ver / editar pedido").click();
  await page.getByLabel("Nome do cliente", { exact: true }).fill("Ana");
  await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  await original.getByRole("button", { name: "Pronto e chamar", exact: true }).click();
  await expect(tv.locator(".tv-current .tv-customer-name")).toHaveText("Ana");
  expect((await readOrders(page)).find(order => order.number === 1)?.customer).toBe("Ana");
  await page.reload(); await tv.reload();
  await expect(tv.locator(".tv-current .tv-customer-name")).toHaveText("Ana");
  expect(await readOrders(page)).toHaveLength(2);
});

test("the opener bridge synchronizes a new TV with isolated storage and no BroadcastChannel", async ({ context, page }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", { configurable: true, value: class { constructor() { throw new Error("Unavailable in this test"); } } });
    if (location.hash.startsWith("#/painel")) {
      const entries = new Map<string, string>();
      Object.defineProperty(window, "localStorage", { configurable: true, value: {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => { entries.set(key, value); },
        removeItem: (key: string) => { entries.delete(key); }, clear: () => entries.clear(),
      } });
    }
  });
  await page.goto("/");
  await createOrder(page, "Carlos");
  await page.getByRole("button", { name: "Fechar confirmação do pedido", exact: true }).click();
  const tv = await openTv(page);
  await expect(tv.locator(".tv-received-order")).toContainText("Carlos");
  await showOrders(page);
  await page.getByRole("button", { name: "Pronto e chamar", exact: true }).click();
  await expect(tv.locator(".tv-current .tv-customer-name")).toHaveText("Carlos");
  await expect(page.getByRole("status")).toContainText("A TV recebeu a chamada 1");
  await page.getByRole("button", { name: /Chamar novamente/ }).click();
  await expect(page.getByRole("status")).toContainText("A TV recebeu a chamada 2");
});

test("polling recovers order updates when storage events and BroadcastChannel are unavailable", async ({ context, page }) => {
  await context.addInitScript(() => {
    Object.defineProperty(window, "BroadcastChannel", { configurable: true, value: class { constructor() { throw new Error("Unavailable in this test"); } } });
    const original = window.addEventListener.bind(window);
    window.addEventListener = ((type: string, ...args: unknown[]) => {
      if (type !== "storage") (original as (...args: unknown[]) => void)(type, ...args);
    }) as typeof window.addEventListener;
  });
  await page.goto("/");
  const tv = await context.newPage();
  await tv.goto("/#/painel");
  await createOrder(page, "Paula");
  await page.getByRole("button", { name: "Ver pedidos em produção", exact: true }).click();
  await expect(tv.locator(".tv-received-order")).toContainText("Paula");
  await page.getByRole("button", { name: "Pronto e chamar", exact: true }).click();
  await expect(tv.locator(".tv-current .tv-customer-name")).toHaveText("Paula");
  await expect(page.getByRole("status")).toContainText("Chamada 1 registrada");
  await expect(page.getByRole("status")).not.toContainText("A TV recebeu");
});

test("the client name and total stay visible on a 16:9 screen", async ({ page }) => {
  await page.goto("/");
  await page.locator("#order-customer").fill("Beatriz");
  for (let i = 0; i < 8; i++) await page.getByTitle("Toque para adicionar").nth(i).click();
  await page.locator(".review-scroll").evaluate(element => { element.scrollTop = element.scrollHeight; });
  const name = await page.locator("#order-customer").boundingBox();
  const confirm = await page.getByRole("button", { name: "Revisar e confirmar", exact: true }).boundingBox();
  expect(name!.y).toBeGreaterThan(0);
  expect(name!.x).toBeGreaterThan(800);
  expect(confirm!.y + confirm!.height).toBeLessThan(768);
  await page.screenshot({ path: "test-results/atendimento-name.png" });
});

test("blank customer is announced as Cliente and focusing the TV keeps the audio enabled", async ({ page }) => {
  await page.goto("/");
  const tv = await openTv(page);
  await tv.getByRole("button", { name: "Ativar som e voz", exact: true }).click();
  await createOrder(page);
  await page.getByRole("button", { name: "Ver pedidos em produção", exact: true }).click();
  await page.getByRole("button", { name: "Pronto e chamar", exact: true }).click();
  await expect(tv.locator(".tv-current .tv-customer-name")).toHaveText("Cliente");
  await expect.poll(() => tv.evaluate(() => (window as unknown as { spoken: string[] }).spoken.includes("Pedido número 1. Cliente. Seu pedido está pronto. Retire no balcão."))).toBe(true);
  await page.getByRole("button", { name: "Ir para a TV", exact: true }).click();
  await expect(tv.getByRole("button", { name: "Silenciar", exact: true })).toBeVisible();
  expect((await readOrders(page))[0]).toMatchObject({ customer: "Cliente", callCount: 1 });
});