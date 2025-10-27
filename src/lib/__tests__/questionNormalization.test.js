import { describe, it, expect } from "vitest";
import { buildNormalizedQuestion, validateNormalizedQuestion } from "@/lib/questionNormalization";

const makeFormState = () => ({
  question: " What is Vref? ",
  choices: {
    A: " 123 kt ",
    B: "129 kt",
    C: "135 kt",
    D: "141 kt",
  },
  choiceA: " 123 kt ",
  choiceB: "129 kt",
  choiceC: "135 kt",
  choiceD: "141 kt",
  answer_key: "b",
  explanations: ["", "B explanation", "", ""],
  explanationsA: "",
  explanationsB: "B explanation",
  questionImage: "",
  choiceImages: ["", "", "", ""],
  difficulty: "Medium",
  category: "A320 Systems",
  access_tier: "pro",
  requires_aircraft: true,
  aircraft: "a320, A321",
  aircraftRaw: "a320, A321",
  status: "draft",
});

describe("questionNormalization", () => {
  it("buildNormalizedQuestion trims, slugifies and normalizes fields", () => {
    const normalized = buildNormalizedQuestion(makeFormState());

    expect(normalized.question).toBe("What is Vref?");
    expect(normalized.choices).toEqual(["123 kt", "129 kt", "135 kt", "141 kt"]);
    expect(normalized.correctIndex).toBe(1);
    expect(normalized.category_slugs).toContain("a320-systems");
    expect(normalized.aircraft).toEqual(["A320", "A321"]);
  });

  it("validateNormalizedQuestion detects missing required data", () => {
    const missingQuestion = validateNormalizedQuestion({
      question: "",
      choices: ["A", "B", "C", "D"],
      correctIndex: 0,
      category_slugs: ["a320"],
      requires_aircraft: false,
      aircraft: [],
    });
    expect(missingQuestion.valid).toBe(false);
    expect(missingQuestion.errors.question).toBeTruthy();

    const missingChoices = validateNormalizedQuestion({
      question: "Valid?",
      choices: ["only one"],
      correctIndex: 0,
      category_slugs: ["a320"],
      requires_aircraft: false,
      aircraft: [],
    });
    expect(missingChoices.valid).toBe(false);
    expect(missingChoices.errors.choices).toBeTruthy();

    const missingAircraft = validateNormalizedQuestion({
      question: "Valid?",
      choices: ["1", "2", "3", "4"],
      correctIndex: 0,
      category_slugs: ["a320"],
      requires_aircraft: true,
      aircraft: [],
    });
    expect(missingAircraft.valid).toBe(false);
    expect(missingAircraft.errors.aircraft).toBeTruthy();
  });

  it("validateNormalizedQuestion passes for normalized payload", () => {
    const normalized = buildNormalizedQuestion(makeFormState());
    const result = validateNormalizedQuestion(normalized);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});
