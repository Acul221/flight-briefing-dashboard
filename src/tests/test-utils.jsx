// src/tests/test-utils.jsx
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

export function AllProviders({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

const customRender = (ui, options = {}) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from "@testing-library/react";
export { customRender as render };

export function renderWithRouter(ui, { route = "/", ...options } = {}) {
  if (typeof window !== "undefined" && window.history?.pushState) {
    window.history.pushState({}, "Test page", route);
  }
  return customRender(ui, options);
}
