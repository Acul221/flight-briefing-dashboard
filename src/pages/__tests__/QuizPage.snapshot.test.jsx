// src/pages/__tests__/QuizPage.snapshot.test.jsx
import React from "react";
import { describe, it, expect } from "vitest";
import { renderWithRouter, screen } from "@/tests/test-utils";
import QuizPage from "@/pages/QuizPage";

/**
 * Stable snapshot & structural tests for QuizPage.
 *
 * Notes:
 * - Some labels like "Aircraft:" appear more than once in the DOM (header + summary line).
 *   Use getAllByText(...)[0] to pick the header occurrence (first one).
 * - Use async findBy* to wait for fetch/loading to complete.
 * - Wait for either a known mocked stem ("What is lift") or fallback "Question 1".
 */

describe("QuizPage structural & snapshot tests", () => {
  it("renders main quiz metadata (labels and mode)", async () => {
    renderWithRouter(<QuizPage />, {
      route: "/?aircraft=a320&subject=systems&mode=practice",
    });

    // Wait for rendered state (the 'practice' token is stable)
    await screen.findByText(/practice/i);

    // Labels like "Aircraft:" may appear multiple times (header and footer summary).
    // Grab all and assert the first occurrence exists (header).
    const aircraftLabels = screen.getAllByText(/Aircraft:/i);
    expect(aircraftLabels.length).toBeGreaterThan(0);
    expect(aircraftLabels[0]).toBeInTheDocument();

    const subjectLabels = screen.getAllByText(/Subject:/i);
    expect(subjectLabels.length).toBeGreaterThan(0);
    expect(subjectLabels[0]).toBeInTheDocument();

    const modeLabels = screen.getAllByText(/Mode:/i);
    expect(modeLabels.length).toBeGreaterThan(0);
    expect(modeLabels[0]).toBeInTheDocument();

    // Confirm the visible mode value (practice) is present somewhere
    expect(screen.getByText(/practice/i)).toBeInTheDocument();

    // Basic UI timer element exists
    const timer = document.querySelector(".tabular-nums");
    expect(timer).toBeTruthy();
  });

  it("exposes difficulty selector and requires-aircraft toggle", async () => {
    renderWithRouter(<QuizPage />, {
      route: "/?aircraft=a320&subject=systems&mode=practice",
    });

    // Wait for the Difficulty label/select to appear
    const difficultySelect = await screen.findByLabelText(/Difficulty/i);
    expect(difficultySelect).toBeInTheDocument();

    // Requires Aircraft checkbox - role+name is resilient to duplicate text elsewhere
    const requiresCheckbox = await screen.findByRole("checkbox", { name: /Requires Aircraft/i });
    expect(requiresCheckbox).toBeInTheDocument();
    expect(requiresCheckbox).not.toBeChecked();
  });

  it("renders question list and matches snapshot (stable-first-question check)", async () => {
    const { container } = renderWithRouter(<QuizPage />, {
      route: "/?aircraft=a320&subject=systems&mode=practice",
    });

    // Wait for either the known mocked stem "What is lift" or fallback "Question 1"
    await screen.findByText(/(What is lift|Question 1)/i);

    // Snapshot the rendered output
    expect(container).toMatchSnapshot();
  });
});
