// src/test-utils.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * renderWithRouter: wrap component with MemoryRouter so useNavigate/useSearchParams works in tests.
 * - ui: React node
 * - options: { route: '/path' , ...renderOptions }
 */
export function renderWithRouter(ui, { route = '/', ...options } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>,
    options
  );
}
