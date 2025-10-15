// src/tests/test-utils.jsx
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { render } from "@testing-library/react";

function wrapWithProviders(children, providers = []) {
  return providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, children);
}

export function renderWithRouter(
  ui,
  { route = "/", initialEntries = [route], path = "/", providers = [] } = {}
) {
  return render(
    wrapWithProviders(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>,
      providers
    )
  );
}

export function renderWithProviders(ui, opts = {}) {
  return renderWithRouter(ui, opts);
}

// Re-export RTL helpers
export * from "@testing-library/react";
