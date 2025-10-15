import "@/tests/mocks/axios.mock.js";
import "@/tests/mocks/hooks.mock.js";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

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
// 3) MOCK Supabase Client (robust across import ids)
// =======================
const supabaseStub = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    signInWithPassword: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  rpc: vi.fn(async () => ({ data: [], error: null })),
  from: vi.fn(() => ({
    select: vi.fn(async () => ({ data: [] })),
    update: vi.fn(async () => ({ data: [] })),
    insert: vi.fn(async () => ({ data: [] })),
    delete: vi.fn(async () => ({ data: [] })),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn(() => ({})) })),
  removeChannel: vi.fn(),
};

vi.mock("@/lib/supabase", () => ({ default: supabaseStub, supabase: supabaseStub }));
vi.mock("@/lib/supabaseClient", () => ({ default: supabaseStub, supabase: supabaseStub }));
vi.mock("@/lib/supabaseClient.js", () => ({ default: supabaseStub, supabase: supabaseStub }));
vi.mock("@/supabase", () => ({ default: supabaseStub, supabase: supabaseStub }));

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

// Global guarded fetch mock for Netlify quiz endpoint
const realFetch = globalThis.fetch ?? (async () => ({ ok: false, json: async () => ({}) }));
globalThis.fetch = vi.fn(async (url, opts) => {
  if (String(url).includes("/.netlify/functions/quiz-pull")) {
    const items = Array.from({ length: 20 }).map((_, i) => {
      const stem = i === 0 ? "What is lift" : `Question ${i + 1}`;
      return {
        id: String(i + 1),
        stem,
        question: stem,
        text: stem,
        choices: ["Option A", "Option B", "Option C", "Option D"],
      };
    });
    return { ok: true, json: async () => ({ items }) };
  }
  return realFetch(url, opts);
});


// Ensure a stable base URL for MemoryRouter relative links
if (!globalThis.location) {
  Object.defineProperty(globalThis, "location", {
    value: new URL("http://localhost/"),
    writable: true,
  });
}

export function setupRouterTest() { /* no-op placeholder for now */ }

afterEach(() => cleanup());
