import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@/tests/test-utils";
import QuestionEditorPanel from "@/components/admin/QuestionEditorPanel";

vi.mock("@/components/admin/CategoryManagerPanel", () => ({
  __esModule: true,
  default: ({ value = "", onChange }) => (
    <input
      aria-label="Category Selector"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  ),
}));

vi.mock("@/components/quiz/QuestionCard", () => ({
  __esModule: true,
  default: ({ question }) => (
    <div data-testid="question-preview">{question?.question}</div>
  ),
}));

const renderEditor = () => render(<QuestionEditorPanel />);

const getQuestionField = () => {
  const label = screen.getByText(/^Question$/i);
  const container = label.closest("div");
  return within(container).getByRole("textbox");
};

const getChoiceElement = (letter) => {
  const labels = screen.getAllByText(/Choice/i);
  const target = labels.find((node) =>
    node.textContent?.toLowerCase().includes(`choice ${letter.toLowerCase()}`)
  );
  if (!target) {
    throw new Error(`Choice label for ${letter} not found`);
  }
  return target.closest("div");
};

const fillChoices = (values) => {
  ["A", "B", "C", "D"].forEach((letter, idx) => {
    const container = getChoiceElement(letter);
    const input = within(container).getAllByRole("textbox")[0];
    fireEvent.change(input, { target: { value: values[idx] ?? `Value ${idx}` } });
  });
};

const selectCorrectAnswer = (value) => {
  const label = screen.getByText(/correct answer/i);
  const container = label.closest("div");
  const select = within(container).getByRole("combobox");
  fireEvent.change(select, { target: { value } });
};

const selectCategory = (value) => {
  const categoryInput = screen.getByLabelText(/category selector/i);
  fireEvent.change(categoryInput, { target: { value } });
};

describe("QuestionEditorPanel", () => {
  beforeEach(() => {
    vi.spyOn(global.console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders without crashing and exposes preview region", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /preview/i }));
    const statusRegion = screen.getByRole("status");
    expect(statusRegion).toBeInTheDocument();
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
  });

  it("disables publish button initially", () => {
    renderEditor();
    const publishButton = screen.getByRole("button", { name: /publish/i });
    expect(publishButton).toBeDisabled();
  });

  it("enables publish after filling required fields", () => {
    renderEditor();

    const questionField = getQuestionField();
    fireEvent.change(questionField, { target: { value: "What is Vref?" } });

    fillChoices(["123", "124", "125", "126"]);
    selectCorrectAnswer("A");
    selectCategory("A320 Systems");

    const publishButton = screen.getByRole("button", { name: /publish/i });
    expect(publishButton).not.toBeDisabled();
  });

  it("requires aircraft when requiresAircraft toggle is on", () => {
    renderEditor();

    const questionField = getQuestionField();
    fireEvent.change(questionField, { target: { value: "What is Vref?" } });
    fillChoices(["Option 0", "Option 1", "Option 2", "Option 3"]);
    selectCorrectAnswer("A");
    selectCategory("A320");

    const publishButton = screen.getByRole("button", { name: /publish/i });
    expect(publishButton).not.toBeDisabled();

    const requiresCheckbox = screen.getByRole("checkbox", { name: /requires aircraft before publish/i });
    fireEvent.click(requiresCheckbox);
    expect(publishButton).toBeDisabled();
    const aircraftError = screen.getByText(/list at least one aircraft/i);
    expect(aircraftError).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/e\.g\. a320/i), { target: { value: "A320" } });
    expect(publishButton).not.toBeDisabled();
  });

  it("logs publish payload on publish click", () => {
    renderEditor();

    const questionField = getQuestionField();
    fireEvent.change(questionField, { target: { value: "What is Vref?" } });
    fillChoices(["Answer 0", "Answer 1", "Answer 2", "Answer 3"]);
    selectCorrectAnswer("A");
    selectCategory("A320");

    const publishButton = screen.getByRole("button", { name: /publish/i });
    fireEvent.click(publishButton);

    expect(console.log).toHaveBeenCalledWith(
      "PUBLISH_PAYLOAD",
      expect.objectContaining({
        question: "What is Vref?",
        choices: expect.arrayContaining(["Answer 0", "Answer 1", "Answer 2", "Answer 3"]),
      })
    );
  });
});

