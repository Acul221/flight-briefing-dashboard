/* eslint-env vitest */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ExamResultPanel from "@/components/quiz/ExamResultPanel.jsx";

describe("ExamResultPanel", () => {
  const questions = [
    {
      id: "q1",
      question_text: "First question?",
      choices: ["A1", "B1", "C1", "D1"],
      correct_index: 0,
    },
    {
      id: "q2",
      question_text: "Second question?",
      choices: ["A2", "B2", "C2", "D2"],
      correct_index: 2,
    },
  ];

  const answers = [
    { questionId: "q1", selectedIndex: 0, correctIndex: 0 }, // correct
    { questionId: "q2", selectedIndex: 1, correctIndex: 2 }, // incorrect
  ];

  it("shows totals and per-question summary", () => {
    render(
      <MemoryRouter>
        <ExamResultPanel questions={questions} answers={answers} categorySlug="a320" />
      </MemoryRouter>
    );

    // Totals
    expect(screen.getByText(/Total/i)).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Correct/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Incorrect/i).length).toBeGreaterThan(0);

    // Questions
    expect(screen.getByText(/First question/i)).toBeInTheDocument();
    expect(screen.getByText(/Second question/i)).toBeInTheDocument();

    // Actions
    const retakeBtn = screen.getByRole("button", { name: /Retake/i });
    fireEvent.click(retakeBtn);

    const backLink = screen.getByText(/Back to category/i);
    expect(backLink).toHaveAttribute("href", "/quiz/a320");
  });
});
