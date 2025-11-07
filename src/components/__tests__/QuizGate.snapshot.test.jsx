import { render } from "@/tests/test-utils";
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

function makeQuestions(n) {
  return Array.from({ length: n }, (_, i) => <div key={i}>Question {i + 1}</div>);
}

describe("QuizGate snapshot tests", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders guest mode correctly", () => {
    useSession.mockReturnValue(null);
    useSubscription.mockReturnValue({ subscription: null });

    const { container } = render(
      <QuizGate total={20}>{makeQuestions(20)}</QuizGate>
    );

    expect(container).toMatchSnapshot();
  });

  it("renders inactive subscription mode correctly", () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "inactive" } });

    const { container } = render(
      <QuizGate total={20}>{makeQuestions(20)}</QuizGate>
    );

    expect(container).toMatchSnapshot();
  });

  it("renders active subscription mode correctly", () => {
    useSession.mockReturnValue({ user: { id: "123" } });
    useSubscription.mockReturnValue({ subscription: { status: "active" } });

    const { container } = render(
      <QuizGate total={20}>{makeQuestions(20)}</QuizGate>
    );

    expect(container).toMatchSnapshot();
  });
});
