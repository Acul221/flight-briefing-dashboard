import React from "react";
import { renderWithRouter } from "@/tests/test-utils";
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

// mock fetch for quiz runtime
beforeAll(() => {
  global.fetch = vi.fn(async (url) => {
    if (String(url).includes("/.netlify/functions/quiz-pull")) {
      return {
        ok: true,
        json: async () => ({
          items: Array.from({ length: 20 }).map((_, i) => {
            const stem = i === 0 ? "What is lift" : `Question ${i + 1}`;
            return {
              id: String(i + 1),
              stem,
              question: stem,
              text: stem,
              choices: ["Option A", "Option B", "Option C", "Option D"],
            };
          }),
        }),
      };
    }
    return { ok: false, json: async () => ({ error: "not mocked" }) };
  });
});

afterAll(() => {
  global.fetch = undefined;
});

describe("QuizPage snapshot tests", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders guest mode correctly", async () => {
    useSession.mockReturnValue(null);
    useSubscription.mockReturnValue({ subscription: null });

    const route = "/quiz/a320/systems?mode=practice";
    const { container, findByText } = renderWithRouter(<QuizPage />, {
      route,
      path: "/quiz/:aircraft/:subject",
    });

    // wait until first question loaded
    await findByText(/What is lift/i);

    expect(container).toMatchSnapshot();
  });

  it("renders inactive subscription mode correctly", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "inactive" } });

    const route = "/quiz/a320/systems?mode=practice";
    const { container, findByText } = renderWithRouter(<QuizPage />, {
      route,
      path: "/quiz/:aircraft/:subject",
    });

    await findByText(/What is lift/i);

    expect(container).toMatchSnapshot();
  });

  it("renders active subscription mode correctly", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "active" } });

    const route = "/quiz/a320/systems?mode=practice";
    const { container, findByText } = renderWithRouter(<QuizPage />, {
      route,
      path: "/quiz/:aircraft/:subject",
    });

    await findByText(/What is lift/i);

    expect(container).toMatchSnapshot();
  });
});
