import React from "react";
import { describe, it, expect } from "vitest";
import App from "@/App"; // gunakan alias @
import { render, screen } from "@/tests/test-utils";


describe("App", () => {
  it("renders without crashing", () => {
    window.history.pushState({}, "Test page", "/");
    render(<App />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
