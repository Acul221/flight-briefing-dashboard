/* eslint-env vitest */
import { rehostImage } from "../rehostImage";

describe("rehostImage", () => {
  test("dev stub prefixes URL when Supabase env missing", async () => {
    const res = await rehostImage("https://example.com/image.jpg");
    expect(res.url).toBe("dev-rehosted://https://example.com/image.jpg");
    expect(res.meta.mode).toBe("dev-stub");
  });

  test("returns null when URL missing", async () => {
    const res = await rehostImage("");
    expect(res.url).toBeNull();
  });
});
