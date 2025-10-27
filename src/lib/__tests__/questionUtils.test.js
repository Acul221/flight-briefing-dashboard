import { describe, it, expect } from "vitest";
import { slugify, mapAnswerKey, parseAircraft, safeStringify } from "@/lib/questionUtils";

describe("questionUtils", () => {
  describe("slugify", () => {
    it("normalizes ascii titles", () => {
      expect(slugify("A320 Systems!")).toBe("a320-systems");
    });

    it("removes diacritics", () => {
      expect(slugify("Café Ops")).toBe("cafe-ops");
    });
  });

  describe("mapAnswerKey", () => {
    it("maps letters to indices", () => {
      expect(mapAnswerKey("b")).toBe(1);
      expect(mapAnswerKey("  D ")).toBe(3);
    });

    it("maps numeric values when valid", () => {
      expect(mapAnswerKey(2)).toBe(2);
      expect(mapAnswerKey("2")).toBe(2);
    });

    it("returns null for invalid values", () => {
      expect(mapAnswerKey("5")).toBeNull();
      expect(mapAnswerKey(null)).toBeNull();
    });
  });

  describe("parseAircraft", () => {
    it("parses comma and slash separated strings", () => {
      expect(parseAircraft("A320, a330 / A321")).toEqual(["A320", "A330", "A321"]);
    });

    it("deduplicates array input", () => {
      expect(parseAircraft(["a320", "A320", " A321 "])).toEqual(["A320", "A321"]);
    });
  });

  describe("safeStringify", () => {
    it("stringifies plain objects round-trippable", () => {
      const payload = { a: 1 };
      const json = safeStringify(payload);
      expect(JSON.parse(json)).toEqual(payload);
    });
  });
});
