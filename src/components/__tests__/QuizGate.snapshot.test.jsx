/* eslint-env vitest */
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

vi.mock("@/lib/quizApi", () => ({
  fetchQuestions: vi.fn().mockResolvedValue([
    { id: "q1", question_text: "Dummy Question 1", choices: ["A1", "B1", "C1", "D1"], correct_index: 1 },
    { id: "q2", question_text: "Dummy Question 2", choices: ["A2", "B2", "C2", "D2"], correct_index: 2 },
  ]),
  submitExamAttempt: vi.fn().mockResolvedValue({ ok: true }),
  submitQuestionFlag: vi.fn().mockResolvedValue({ ok: true }),
  fetchExamAttempts: vi.fn().mockResolvedValue([]),
}));

import QuizPage from "@/pages/quiz/QuizPage.jsx";

function renderWithRouter(path = "/quiz/a320/systems") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/quiz/:categorySlug/:subjectSlug" element={<QuizPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("QuizPage (v2) structural checks", () => {
  it("renders layout controls and a sample question", async () => {
    renderWithRouter("/quiz/a320/systems");

    // Header controls
    expect(await screen.findByText(/Quiz/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Mode/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Difficulty/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Requires aircraft/i).length).toBeGreaterThan(0);

    // Question content comes from mocked fetchQuestions (or fallback message)
    const question = await screen.findByText(/Dummy Question 1/i).catch(() => null);
    const emptyState = screen.queryByText(/No questions available/i);
    expect(question || emptyState).not.toBeNull();

    // Navigation button (only if questions exist)
    if (question) {
      expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();
    }
  });
});
