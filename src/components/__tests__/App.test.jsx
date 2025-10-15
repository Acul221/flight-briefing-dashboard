import { screen } from "@testing-library/react";
import { renderWithRouter } from "@/tests/test-utils";
import React from "react";
import App from "@/App";  // ✅ gunakan alias @
import { describe, it, expect } from "vitest";

describe("App", () => {
  it("renders without crashing", () => {
    renderWithRouter(<App />, { route: "/", path: "/*" });
    expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
    // 👉 ganti "Skydeck" dengan teks pasti yang memang muncul di App.jsx kamu
  });
});
