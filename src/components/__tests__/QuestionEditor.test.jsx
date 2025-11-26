/* eslint-env vitest */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi } from "vitest";
import QuestionEditor from "@/components/admin/QuestionEditor.jsx";

describe("QuestionEditor (Quick) validation & preview", () => {
  const fillValidForm = () => {
    fireEvent.change(screen.getByTestId("input-question"), { target: { value: "What creates lift?" } });
    ["Airfoil shape", "Angle of attack", "Ground effect", "Magic"].forEach((val, idx) => {
      fireEvent.change(screen.getByTestId(`input-choice-${idx}`), { target: { value: val } });
    });
    fireEvent.click(screen.getByTestId("radio-correct-0"));
    fireEvent.change(screen.getByTestId("select-category"), { target: { value: "systems" } });
  };

  test("publish shows aria-disabled when required fields empty", () => {
    render(<QuestionEditor />);

    const publishBtn = screen.getByTestId("btn-publish");
    expect(publishBtn).toHaveAttribute("aria-disabled", "true");
  });

  test("preview updates when inputs change and toggles viewport", async () => {
    render(<QuestionEditor />);

    const qInput = screen.getByTestId("input-question");
    fireEvent.change(qInput, { target: { value: "What creates lift?" } });

    const choice0 = screen.getByTestId("input-choice-0");
    fireEvent.change(choice0, { target: { value: "Airfoil shape" } });

    const radio0 = screen.getByTestId("radio-correct-0");
    fireEvent.click(radio0);

    const category = screen.getByTestId("select-category");
    fireEvent.change(category, { target: { value: "systems" } });

    const previewList = await screen.findByLabelText(/Answer choices/i);
    const previewWithin = within(previewList);
    expect(previewWithin.getByText(/Airfoil shape/i)).toBeInTheDocument();

    // switch to mobile viewport for live preview
    fireEvent.click(screen.getByTestId("preview-mobile"));
    expect(screen.getByTestId("preview-container").className).toMatch(/max-w-xs/);
  });

  test("allows publish when valid and shows modal when invalid click", () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<QuestionEditor />);

    // invalid click -> modal opened
    fireEvent.click(screen.getByTestId("btn-publish"));
    expect(screen.getByText(/validation errors/i)).toBeInTheDocument();

    // close modal
    fireEvent.click(screen.getByText(/Close/i));

    // fill valid form -> aria-disabled false and publish triggers alert payload
    fillValidForm();
    const publishBtn = screen.getByTestId("btn-publish");
    expect(publishBtn).toHaveAttribute("aria-disabled", "false");
    fireEvent.click(publishBtn);
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  test("mobile preview snapshot is stable", async () => {
    const originalRandom = Math.random;
    Math.random = () => 0.123456;
    render(<QuestionEditor />);

    // minimal inputs
    fireEvent.change(screen.getByTestId("input-question"), { target: { value: "Snap question" } });
    fireEvent.change(screen.getByTestId("input-choice-0"), { target: { value: "Opt 1" } });
    fireEvent.change(screen.getByTestId("select-category"), { target: { value: "systems" } });
    fireEvent.click(screen.getByTestId("radio-correct-0"));

    fireEvent.click(screen.getByTestId("preview-mobile"));
    const container = screen.getByTestId("preview-container");
    expect(container.className).toMatchInlineSnapshot('"border rounded p-3 bg-white max-w-xs"');

    Math.random = originalRandom;
  });
});
