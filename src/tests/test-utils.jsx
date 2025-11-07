// src/tests/test-utils.jsx
import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/**
 * Reuse TestWrapper exported from src/tests/vitest.setup.jsx if present.
 * Fallback: minimal MemoryRouter wrapper.
 */
let UserTestWrapper = null;

const tryRequire = (path) => {
  if (typeof require !== "function") return null;
  try {
    return require(path);
  } catch (err) {
    return null;
  }
};

const maybe1 = tryRequire("./vitest.setup.jsx");     // src/tests/vitest.setup.jsx
const maybe2 = tryRequire("../vitest.setup.jsx");    // src/vitest.setup.jsx
const maybe3 = tryRequire("../../vitest.setup.jsx"); // root vitest.setup.jsx
const candidate = maybe1 || maybe2 || maybe3;
if (candidate && candidate.TestWrapper) UserTestWrapper = candidate.TestWrapper;

export function AllProviders({ children }) {
  if (UserTestWrapper) return <UserTestWrapper>{children}</UserTestWrapper>;
  return <MemoryRouter>{children}</MemoryRouter>;
}

const customRender = (ui, options = {}) =>
  render(ui, { wrapper: AllProviders, ...options });

// re-export testing library helpers
export * from "@testing-library/react";
export { customRender as render };

/** helper to push route and render */
export function renderWithRouter(ui, { route = "/", ...options } = {}) {
  if (typeof window !== "undefined" && window.history && typeof window.history.pushState === "function") {
    window.history.pushState({}, "Test page", route);
  }
  return customRender(ui, options);
}
