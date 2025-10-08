import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import QuizPage from "../QuizPage";

// mock hooks
vi.mock("@/hooks/useSession", () => ({
  useSession: vi.fn(),
}));
vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn(),
}));

import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";

// mock react-router params
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ aircraft: "a320", subject: "systems" }),
  };
});

// mock fetch to return dummy questions
beforeAll(() => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve([
          {
            id: "q1",
            question: "What is lift?",
            choices: [
              { text: "Force upward", isCorrect: true, explanation: "Correct" },
              { text: "Force downward", isCorrect: false, explanation: "Wrong" },
            ],
            tags: ["aero"],
            source: "FCOM",
            level: "easy",
          },
          {
            id: "q2",
            question: "What is drag?",
            choices: [
              { text: "Force resisting motion", isCorrect: true, explanation: "Correct" },
              { text: "Force upward", isCorrect: false, explanation: "Wrong" },
            ],
            tags: ["aero"],
            source: "FCOM",
            level: "medium",
          },
        ]),
    })
  );
});

describe("QuizPage snapshot tests", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders guest mode correctly", async () => {
    useSession.mockReturnValue(null);
    useSubscription.mockReturnValue({ subscription: null });

    const { container, findByText } = render(<QuizPage />);

    // wait until first question loaded
    await findByText(/What is lift/i);

    expect(container).toMatchSnapshot();
  });

  it("renders inactive subscription mode correctly", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "inactive" } });

    const { container, findByText } = render(<QuizPage />);

    await findByText(/What is lift/i);

    expect(container).toMatchSnapshot();
  });

  it("renders active subscription mode correctly", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "active" } });

    const { container, findByText } = render(<QuizPage />);

    await findByText(/What is lift/i);

    expect(container).toMatchSnapshot();
  });
});
