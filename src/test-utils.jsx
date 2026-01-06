// src/test-utils.jsx
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

export function renderWithRouter(ui, { route = "/", ...options } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>, options);
}
