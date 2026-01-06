/* eslint-env vitest */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QuizRunner from "@/components/quiz/QuizRunner.jsx";
import { vi, describe, it, beforeEach, expect } from "vitest";

vi.mock("@/lib/quizApi", () => {
  return {
    fetchQuestions: vi.fn(),
    submitExamAttempt: vi.fn(),
  };
});

import { fetchQuestions, submitExamAttempt } from "@/lib/quizApi";

describe("QuizRunner exam flow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    fetchQuestions.mockResolvedValue([
      {
        id: "q1",
        question_text: "Demo question 1?",
        choices: ["A1", "B1", "C1", "D1"],
        correct_index: 0,
      },
      {
        id: "q2",
        question_text: "Demo question 2?",
        choices: ["A2", "B2", "C2", "D2"],
        correct_index: 1,
      },
    ]);
    submitExamAttempt.mockResolvedValue({ ok: true });
  });

  it("finishes exam, shows result panel, and calls submitExamAttempt", async () => {
    render(
      <MemoryRouter>
        <QuizRunner
          subjectSlug="a320-autoflight"
          parentSlug="a320"
          mode="exam"
          difficulty="all"
          requiresAircraft={false}
          isPro={true}
        />
      </MemoryRouter>
    );

    // wait first question
    await screen.findByText(/Demo question 1\?/i);

    // answer q1
    fireEvent.click(screen.getByTestId("choice-0"));
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // answer q2
    await screen.findByText(/Demo question 2\?/i);
    fireEvent.click(screen.getByTestId("choice-0"));
    // finish
    const finishBtn = screen.getByRole("button", { name: /Finish/i });
    fireEvent.click(finishBtn);

    // result panel
    await screen.findByText(/Exam Results/i, {}, { timeout: 2000 });

    await waitFor(() => {
      expect(submitExamAttempt).toHaveBeenCalledTimes(1);
    });
    const payload = submitExamAttempt.mock.calls[0][0];
    expect(payload.subjectSlug).toBe("a320-autoflight");
    expect(payload.answers).toHaveLength(2);
  });
});
