import { test, expect } from "@playwright/test";

const STORE_KEY = "strelnikova.settings.v2";

// быстрые настройки без звука и пауз, чтобы smoke шёл секунды
function seed(page, settings) {
  return page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [STORE_KEY, JSON.stringify(settings)]
  );
}

test("старт, пауза, продолжение и сброс", async ({ page }) => {
  await seed(page, { bpm: 150, counts: 32, rounds: 1, pauseExSec: 0, pauseRoundSec: 0, sound: false, voice: false });
  await page.goto("/");
  await expect(page.locator("#phase")).toHaveText("готов");

  await page.click("#startBtn");
  await expect(page.locator("#phase")).toHaveText("Ладошки");
  await expect(page.locator("#bigNumber")).toHaveText("3", { timeout: 5000 });

  await page.click("#startBtn");
  await expect(page.locator("#startBtn")).toHaveText("Продолжить");
  const frozen = await page.locator("#bigNumber").textContent();
  await page.waitForTimeout(900);
  await expect(page.locator("#bigNumber")).toHaveText(frozen);

  await page.click("#startBtn");
  await expect(page.locator("#startBtn")).toHaveText("Пауза");

  await page.click("#resetBtn");
  await expect(page.locator("#phase")).toHaveText("готов");
  await expect(page.locator("#bigNumber")).toHaveText("0");
});

test("тренировка из одного упражнения доходит до конца", async ({ page }) => {
  await seed(page, {
    bpm: 150, counts: 8, rounds: 1, pauseExSec: 0, pauseRoundSec: 0, sound: false, voice: false,
    exercises: [true, false, false, false, false, false, false, false, false, false, false, false],
  });
  await page.goto("/");
  await expect(page.locator("#seriesInfo")).toHaveText(/упражнений: 1/);

  // единственное включённое упражнение снять нельзя
  await page.click("summary");
  const first = page.locator(".ex-item input").first();
  await first.click();
  await expect(first).toBeChecked();
  await page.click("summary");

  await page.click("#startBtn");
  await expect(page.locator("#phase")).toHaveText("Ладошки");
  // 8 счётов по 400 мс: тренировка завершается сама и возвращается в исходное состояние
  await expect(page.locator("#phase")).toHaveText("готов", { timeout: 8000 });
  await expect(page.locator("#startBtn")).toHaveText("Старт");
});
