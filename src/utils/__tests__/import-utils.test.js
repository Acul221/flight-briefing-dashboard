/* eslint-env vitest */
import { normalizeRow, validateCanonical } from "../import-utils";

describe("import-utils", () => {
  test("normalize maps choice aliases and correct index", () => {
    const row = {
      question: "Q?",
      "Choice A": "One",
      "Choice B": "Two",
      "Choice C": "Three",
      "Choice D": "Four",
      "Answer Key": "B",
      "Category Path": "A320 > systems / electrical",
    };
    const normalized = normalizeRow(row);
    expect(normalized.choices).toEqual(["One", "Two", "Three", "Four"]);
    expect(normalized.correctIndex).toBe(1);
    expect(normalized.category_slugs).toEqual(["a320", "systems", "electrical"]);
  });

  test("validate catches missing fields", () => {
    const bad = normalizeRow({});
    const { ok, errors } = validateCanonical(bad);
    expect(ok).toBe(false);
    expect(errors.some((e) => e.includes("question_text"))).toBe(true);
  });
});
