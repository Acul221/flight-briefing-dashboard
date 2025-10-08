import { render, screen } from "@testing-library/react";
import React from "react";
import App from "@/App";  // ✅ gunakan alias @
import { describe, it, expect } from "vitest";

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText(/Skydeck/i)).toBeInTheDocument(); 
    // 👉 ganti "Skydeck" dengan teks pasti yang memang muncul di App.jsx kamu
  });
});
