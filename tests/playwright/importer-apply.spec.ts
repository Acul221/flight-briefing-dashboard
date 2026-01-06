import { test, expect } from "@playwright/test";

test("dry-run -> apply flow", async ({ page }) => {
  let capturedApply: any = null;

  await page.route("**/.netlify/functions/notion-import-dryrun", (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true, reports: [{ status: "ok" }] }) })
  );

  await page.route("**/.netlify/functions/notion-import-apply", (route) => {
    const req = JSON.parse(route.request().postData() || "{}");
    capturedApply = req;
    expect(req.dry_run).toBe(false);
    expect(req.rows?.[0]?.images_meta).toBeTruthy();
    route.fulfill({ status: 200, body: JSON.stringify({ results: [{ ok: true, id: "q-1" }] }) });
  });

  await page.goto("about:blank");
  await page.evaluate(async () => {
    const row = {
      question: "Q?",
      "Choice A": "A",
      "Choice B": "B",
      "Choice C": "C",
      "Choice D": "D",
      "Answer Key": "A",
      "Category Path": "root > child",
      choice_images: ["u1", "u2", "u3", "u4"],
      question_image_url: "q",
      images_meta: { question: { mode: "dev-stub" }, choices: [{}, {}, {}, {}] },
    };
    await fetch("/.netlify/functions/notion-import-dryrun", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": "test" },
      body: JSON.stringify({ rows: [row] }),
    });
    await fetch("/.netlify/functions/notion-import-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": "test" },
      body: JSON.stringify({ dry_run: false, rows: [row] }),
    });
  });

  expect(capturedApply).not.toBeNull();
  expect(capturedApply.rows[0].images_meta).toBeTruthy();
  expect(capturedApply.rows[0].choice_images.length).toBe(4);
});
