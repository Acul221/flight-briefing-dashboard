import React from "react"; // ✅ WAJIB ada kalau pakai JSX
import { render, screen, fireEvent } from "@/tests/test-utils";
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

afterAll(() => {
  global.fetch = undefined;
});

/* ---------- helpers ---------- */
async function simulateQuizFlow(expectedCount) {
  // Wait first item to render
  await screen.findByText(/Dummy question 1/i);

  let count = 1;
  while (true) {
    // prefer labeled "Next Question" button used in current UI; fallback to other selectors if needed
    const nextBtn =
      screen.queryByRole("button", { name: /Next Question/i }) ||
      screen.queryByRole("button", { name: /Next/i }) ||
      screen.queryByText(/Next/i);

    const finishBtn =
      screen.queryByRole("button", { name: /Finish & Review/i }) ||
      screen.queryByRole("button", { name: /Finish/i }) ||
      screen.queryByText(/Finish/i);

    if (nextBtn) {
      fireEvent.click(nextBtn);
      count++;
      // slight delay simulation not necessary; DOM updates are synchronous in testing environment
    } else if (finishBtn) {
      break;
    } else {
      break;
    }
    // safety guard: avoid infinite loop
    if (count > 1000) break;
  }
  expect(count).toBe(expectedCount);
}

// flexible check helper: allow split nodes or CTA buttons/links
function expectGatingForLogin() {
  // 1) text node that may be split across elements
  const textNode = screen.queryByText((content, node) => {
    if (!node) return false;
    const txt = node.textContent?.replace(/\s+/g, " ").trim() || "";
    return /login to access more questions/i.test(txt) || /login to access/i.test(txt);
  });
  // 2) explicit Login CTA (button or link)
  const loginCTA =
    screen.queryByRole("button", { name: /login/i }) ||
    screen.queryByRole("link", { name: /login/i });

  expect(textNode || loginCTA).toBeTruthy();
}

function expectGatingForUpgrade() {
  const textNode = screen.queryByText((content, node) => {
    if (!node) return false;
    const txt = node.textContent?.replace(/\s+/g, " ").trim() || "";
    return /upgrade to.*unlock all questions/i.test(txt) || /upgrade to unlock/i.test(txt) || /upgrade to access/i.test(txt);
  });
  const upgradeCTA =
    screen.queryByRole("button", { name: /upgrade/i }) ||
    screen.queryByRole("link", { name: /upgrade/i });

  expect(textNode || upgradeCTA).toBeTruthy();
}

/* ---------- tests ---------- */
describe("QuizPage integration with navigation", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("guest should only access 10 questions", async () => {
    useSession.mockReturnValue(null);
    useSubscription.mockReturnValue({ subscription: null });

    render(<QuizPage />);
    await simulateQuizFlow(10);

    // replace strict string match with robust helper
    expectGatingForLogin();
  });

  it("inactive user should only access 10 questions", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "inactive" } });

    render(<QuizPage />);
    await simulateQuizFlow(10);

    expectGatingForUpgrade();
  });

  it("active subscriber should access all 25 questions", async () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "active" } });

    render(<QuizPage />);
    await simulateQuizFlow(25);

    // Ensure gating messages/CTAs are not present
    const loginCTA =
      screen.queryByRole("button", { name: /login/i }) ||
      screen.queryByRole("link", { name: /login/i }) ||
      screen.queryByText(/login to access more questions/i);
    const upgradeCTA =
      screen.queryByRole("button", { name: /upgrade/i }) ||
      screen.queryByRole("link", { name: /upgrade/i }) ||
      screen.queryByText(/upgrade to.*unlock all questions/i);

    expect(loginCTA).toBeNull();
    expect(upgradeCTA).toBeNull();
  });
});
