/* eslint-env vitest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuizRunner from "@/components/quiz/QuizRunner.jsx";

const mockFetchQuestions = vi.fn();
vi.mock("@/lib/quizApi", () => ({ fetchQuestions: (...args) => mockFetchQuestions(...args) }));

const sampleQuestions = [
  { id: "q1", question_text: "First question?", choices: ["A1", "B1", "C1", "D1"], correct_index: 0, explanation_html: "<p>Exp1</p>" },
  { id: "q2", question_text: "Second question?", choices: ["A2", "B2", "C2", "D2"], correct_index: 1, explanation_html: "<p>Exp2</p>" },
];

describe("QuizRunner", () => {
  beforeEach(() => {
    mockFetchQuestions.mockReset();
  });

  test("Learn mode: can select and check answer to show explanation", async () => {
    mockFetchQuestions.mockResolvedValueOnce(sampleQuestions);

    render(
      <QuizRunner
        subjectSlug="test"
        mode="learn"
        difficulty="all"
        requiresAircraft={false}
        isPro={true}
      />
    );

    await screen.findByText(/First question/i);

    fireEvent.click(screen.getByText(/A1/));
    const checkBtn = screen.getByText(/Check Answer/i);
    fireEvent.click(checkBtn);

    await waitFor(() => expect(screen.getByText(/Exp1/i)).toBeInTheDocument());
  });

  test("Free gating: non-pro limited to 10 questions", async () => {
    const twenty = Array.from({ length: 20 }).map((_, i) => ({
      id: `q${i}`,
      question_text: `Q${i}`,
      choices: ["A", "B", "C", "D"],
      correct_index: 0,
    }));
    mockFetchQuestions.mockResolvedValueOnce(twenty);

    render(
      <QuizRunner
        subjectSlug="test"
        mode="exam"
        difficulty="all"
        requiresAircraft={false}
        isPro={false}
      />
    );

    await screen.findByText(/Q0/);
    expect(screen.getByText(/Question 1 \/ 10/i)).toBeInTheDocument();
  });
});
