// src/pages/__tests__/QuizPage.integration.test.jsx
import React from "react"; // ✅ WAJIB ada kalau pakai JSX
import { render, screen, fireEvent } from "@/tests/test-utils";
import { vi } from "vitest";
import QuizPage from "../QuizPage";

// mock hooks BEFORE importing their named exports
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
const originalFetch = global.fetch;
beforeAll(() => {
  global.fetch = vi.fn(async (url) => {
    if (String(url).includes("/.netlify/functions/quiz-pull")) {
      const items = Array.from({ length: 25 }, (_, i) => {
        const stem = `Dummy question ${i + 1}`;
        return {
          id: `q${i + 1}`,
          legacy_id: `legacy-${i + 1}`,
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

afterAll(() => {
  // restore original fetch (if any)
  if (originalFetch) global.fetch = originalFetch;
  else delete global.fetch;
});

async function simulateQuizFlow(expectedCount) {
  // wait first item to appear
  await screen.findByText(/Dummy question 1/i);

  let count = 1;
  const maxSteps = Math.max(expectedCount + 5, 50); // safety cap

  for (let i = 0; i < maxSteps; i++) {
    // prefer to find the "Finish & Review" button first
    const finishBtn = screen.queryByRole("button", { name: /Finish & Review/i });
    if (finishBtn) {
      // stop when finish appears (we assume we reached the end)
      break;
    }

    const nextBtn = screen.queryByRole("button", { name: /Next Question/i });
    if (!nextBtn) {
      // no next button present -> break
      break;
    }

    // only click if not disabled
    const isDisabled =
      nextBtn.hasAttribute("disabled") ||
      nextBtn.getAttribute("aria-disabled") === "true" ||
      nextBtn.classList.contains("disabled") ||
      nextBtn.getAttribute("disabled") === "true";

    if (isDisabled) {
      // if it's disabled but finish not visible, try a small wait for UI updates
      // (findByText on next question stem could be used, but keep simple)
      await new Promise((r) => setTimeout(r, 50));
      continue;
    }

    fireEvent.click(nextBtn);
    count++;

    // fast-exit if we've reached the expected count
    if (count >= expectedCount) break;
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
