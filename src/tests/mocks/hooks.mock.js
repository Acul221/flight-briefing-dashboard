// src/tests/mocks/hooks.mock.js
import { vi } from "vitest";

vi.mock("@/hooks/useRAC", () => {
  const value = {
    racData: { checkpoints: {}, actualTimes: {} },
    setRacData: vi.fn(),
    settings: { thresholds: {} },
    checkpoints: [],
    checkDelay: vi.fn(),
  };
  const useRAC = () => value;
  return { default: useRAC, useRAC };
});

vi.mock("@/hooks/usePsiTrend", () => {
  const usePsiTrend = () => ({ trend: [], loading: false, error: null });
  return { default: usePsiTrend, usePsiTrend };
});
