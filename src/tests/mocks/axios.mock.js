// src/tests/mocks/axios.mock.js
import { vi } from "vitest";

vi.mock("axios", () => {
  const get = vi.fn(async (url) => {
    if (url.includes("/.netlify/functions/fetch-alerts")) {
      return { data: { alerts: [] } };
    }
    return { data: {} };
  });
  return { default: { get } };
});

