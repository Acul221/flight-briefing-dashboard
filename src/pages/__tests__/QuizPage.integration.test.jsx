import React from "react"; // ✅ WAJIB ada kalau pakai JSX
import { render, screen, fireEvent } from "@testing-library/react";
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

// mock fetch to return dummy questions with expected shape
beforeAll(() => {
  global.fetch = vi.fn(async (url) => {
    if (String(url).includes("/.netlify/functions/quiz-pull")) {
      const items = Array.from({ length: 25 }, (_, i) => {
        const stem = `Dummy question ${i + 1}`;
        return {
          id: `q${i + 1}`,
          stem,
          question: stem,
          text: stem,
          choices: ["Option A", "Option B", "Option C", "Option D"],
        };
      });
      return { ok: true, json: async () => ({ items }) };
    }
    return { ok: false, json: async () => ({ error: "not mocked" }) };
  });
});

afterAll(() => { global.fetch = undefined; });

async function simulateQuizFlow(expectedCount) {
  await screen.findByText(/Dummy question 1/i);

  let count = 1;
  while (true) {
    const nextBtn = screen.queryByRole("button", { name: /Next Question/i });
    const finishBtn = screen.queryByRole("button", { name: /Finish & Review/i });

    if (nextBtn) {
      fireEvent.click(nextBtn);
      count++;
    } else if (finishBtn) {
      break;
    } else {
      break;
    }
  }
  expect(count).toBe(expectedCount);
}

describe("QuizPage integration with navigation", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("guest should only access 10 questions", async () => {
    useSession.mockReturnValue(null);
    useSubscription.mockReturnValue({ subscription: null });

    render(<QuizPage />);
    await simulateQuizFlow(10);

    expect(
      screen.getByText(/Login to access more questions/i)
    ).toBeInTheDocument();
  });

  it("inactive user should only access 10 questions", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "inactive" } });

    render(<QuizPage />);
    await simulateQuizFlow(10);

    expect(
      screen.getByText(/Upgrade to.*unlock all questions/i)
    ).toBeInTheDocument();
  });

  it("active subscriber should access all 25 questions", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "active" } });

    render(<QuizPage />);
    await simulateQuizFlow(25);

    expect(
      screen.queryByText(/Login to access more questions/i)
    ).toBeNull();
    expect(
      screen.queryByText(/Upgrade to.*unlock all questions/i)
    ).toBeNull();
  });
});
