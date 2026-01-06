/* eslint-env vitest */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CategorySidebar from "@/components/quiz/CategorySidebar.jsx";

const mockFetch = vi.fn();
global.fetch = (...args) => mockFetch(...args);

describe("CategorySidebar", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  test("renders categories from endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [{ id: 1, slug: "general", label: "General", is_active: true }] }),
    });
    render(
      <MemoryRouter>
        <CategorySidebar />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/General/)).toBeInTheDocument());
  });

  test("shows error message on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "fail" }),
    });
    render(
      <MemoryRouter>
        <CategorySidebar />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText(/fail/)).toBeInTheDocument());
  });
});
