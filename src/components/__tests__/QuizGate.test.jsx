import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import QuizGate from "../QuizGate";

// mock hooks
vi.mock("../../hooks/useSession", () => ({
  useSession: vi.fn(),
}));
vi.mock("../../hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

import { useSession } from "../../hooks/useSession";
import { useSubscription } from "../../hooks/useSubscription";

// helper: generate dummy questions
function makeQuestions(n) {
  return Array.from({ length: n }, (_, i) => <div key={i}>Question {i + 1}</div>);
}

describe("QuizGate component", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("limits to 10 questions for guest", () => {
    useSession.mockReturnValue(null);
    useSubscription.mockReturnValue({ subscription: null });

    render(<QuizGate total={20}>{makeQuestions(20)}</QuizGate>);

    // only 10 questions rendered
    expect(screen.getAllByText(/Question/).length).toBe(10);

    // Guest CTA shown
    expect(
      screen.getByText(/Login to access more questions/i)
    ).toBeInTheDocument();
  });

  it("limits to 10 questions for user without active subscription", () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "inactive" } });

    render(<QuizGate total={20}>{makeQuestions(20)}</QuizGate>);

    // only 10 questions rendered
    expect(screen.getAllByText(/Question/).length).toBe(10);

    // Upgrade CTA shown (regex handles <b> split)
    expect(
      screen.getByText(/Upgrade to.*unlock all questions/i)
    ).toBeInTheDocument();
  });

  it("shows all questions for user with active subscription", () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "active" } });

    render(<QuizGate total={20}>{makeQuestions(20)}</QuizGate>);

    // all questions rendered
    expect(screen.getAllByText(/Question/).length).toBe(20);

    // no Guest or Upgrade CTA
    expect(screen.queryByText(/Login to access more questions/i)).toBeNull();
    expect(screen.queryByText(/Upgrade to.*unlock all questions/i)).toBeNull();
  });
});
