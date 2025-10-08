import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";

// =======================
// 1) MOCK <canvas>
// =======================
Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: [] }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  }),
});

// =======================
// 2) MOCK lottie-web
// =======================
vi.mock("lottie-web", () => ({
  default: {
    loadAnimation: vi.fn(() => ({
      play: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  },
}));

// =======================
// 3) MOCK Supabase Client
// =======================
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [] }),
      update: vi.fn().mockResolvedValue({ data: [] }),
      insert: vi.fn().mockResolvedValue({ data: [] }),
      delete: vi.fn().mockResolvedValue({ data: [] }),
      eq: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null })),
  },
}));

// =======================
// 4) MOCK useSession & useSubscription
// =======================
vi.mock("@/hooks/useSession", () => ({
  useSession: () => null, // default guest
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => ({ subscription: null, loading: false }),
}));

// =======================
// 5) DUMMY Auth/Session Provider
// =======================
const AuthContext = React.createContext({});
export const DummyAuthProvider = ({ children }) => (
  <AuthContext.Provider value={{ session: {} }}>
    {children}
  </AuthContext.Provider>
);

// =======================
// 6) DUMMY RAC Provider
// =======================
const RACContext = React.createContext({});
export const DummyRACProvider = ({ children }) => (
  <RACContext.Provider
    value={{
      racData: {},
      setRacData: () => {},
      settings: { thresholds: {} },
      checkDeviation: () => {},
    }}
  >
    {children}
  </RACContext.Provider>
);

// =======================
// 7) GLOBAL Test Wrapper
// =======================
export const TestWrapper = ({ children }) => (
  <MemoryRouter>
    <DummyAuthProvider>
      <DummyRACProvider>{children}</DummyRACProvider>
    </DummyAuthProvider>
  </MemoryRouter>
);
