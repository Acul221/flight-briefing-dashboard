// src/tests/vitest.setup.jsx
// Robust Vitest setup for SkyDeckPro tests
import "@testing-library/jest-dom";
import React from "react";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

try {
  // eslint-disable-next-line no-console
  console.info("[vitest.setup] loaded");
} catch (e) {}

function createLottieModule() {
  return {
    default: {
      loadAnimation: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        destroy: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    },
  };
}

function createSupabaseModule() {
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

  return { default: supabaseStub, supabase: supabaseStub };
}

function createUseSessionModule() {
  return { useSession: () => null };
}

function createUseSubscriptionModule() {
  return { useSubscription: () => ({ subscription: null, loading: false }) };
}

function createRAC() {
  return {
    racData: {},
    setRacData: vi.fn(),
    settings: { thresholds: {} },
    setSettings: vi.fn(),
    checkpoints: [],
    checkDeviation: vi.fn(() => false),
    loading: false,
    refresh: vi.fn(async () => ({})),
  };
}

function createRacHookModule() {
  const useRAC = () => createRAC();
  return { useRAC, default: useRAC };
}

function createReactHookFormModule() {
  return {
    useFormContext: () => ({
      form: { category: "" },
      register: () => ({}),
      control: {},
      watch: () => undefined,
      getValues: () => ({ category: "" }),
      setValue: () => {},
    }),
    Controller: ({ children }) => (typeof children === "function" ? children() : children),
    useFieldArray: () => ({ fields: [], append: () => {}, remove: () => {} }),
    default: {},
  };
}

function questionEditorFactory() {
  return {
    form: { category: "", question: {}, choices: [], setValue: () => {} },
    parents: [],
    setForm: () => {},
    submit: () => Promise.resolve(),
    getParentByLabel: () => undefined,
  };
}

function createQuestionEditorModule() {
  return {
    useQuestionEditor: questionEditorFactory,
    useQuestionForm: questionEditorFactory,
    default: questionEditorFactory,
  };
}

function createRacContextModule() {
  const defaultValue = createRAC();
  const RACContext = React.createContext(defaultValue);
  const RACProvider = ({ children }) => (
    <RACContext.Provider value={createRAC()}>{children}</RACContext.Provider>
  );
  const useRAC = () => React.useContext(RACContext) ?? createRAC();
  return { RACProvider, useRAC, RACContext };
}

vi.mock("lottie-web", () => createLottieModule(), { virtual: true });

vi.mock("@/lib/supabase", () => createSupabaseModule(), { virtual: true });
vi.mock("@/lib/supabaseClient", () => createSupabaseModule(), { virtual: true });
vi.mock("@/lib/supabaseClient.js", () => createSupabaseModule(), { virtual: true });
vi.mock("@/supabase", () => createSupabaseModule(), { virtual: true });
vi.mock("lib/supabase", () => createSupabaseModule(), { virtual: true });
vi.mock("src/lib/supabase", () => createSupabaseModule(), { virtual: true });

vi.mock("@/hooks/useSession", () => createUseSessionModule(), { virtual: true });
vi.mock("src/hooks/useSession", () => createUseSessionModule(), { virtual: true });
vi.mock("@/hooks/useSubscription", () => createUseSubscriptionModule(), { virtual: true });

vi.mock("@/hooks/useRAC", () => createRacHookModule(), { virtual: true });
vi.mock("@/context/useRAC", () => createRacHookModule(), { virtual: true });
vi.mock("@/contexts/rac", () => createRacHookModule(), { virtual: true });
vi.mock("@/RACContext", () => createRacHookModule(), { virtual: true });
vi.mock("@/hooks/useRACContext", () => createRacHookModule(), { virtual: true });
vi.mock("src/hooks/useRAC", () => createRacHookModule(), { virtual: true });

vi.mock("@/context/RACContext", () => createRacContextModule(), { virtual: true });
vi.mock("src/context/RACContext", () => createRacContextModule(), { virtual: true });

vi.mock("react-hook-form", () => createReactHookFormModule(), { virtual: true });

vi.mock("@/hooks/useQuestionEditor", () => createQuestionEditorModule(), { virtual: true });
vi.mock("@/hooks/useQuestionForm", () => createQuestionEditorModule(), { virtual: true });
vi.mock("@/hooks/useQuestionEditorContext", () => createQuestionEditorModule(), { virtual: true });
vi.mock("@/hooks/useQuestion", () => createQuestionEditorModule(), { virtual: true });
vi.mock("@/hooks/useEditor", () => createQuestionEditorModule(), { virtual: true });
vi.mock("@/hooks/questionEditor", () => createQuestionEditorModule(), { virtual: true });
vi.mock("@/components/admin/hooks/useQuestionEditor", () => createQuestionEditorModule(), { virtual: true });
vi.mock("src/hooks/useQuestionEditor", () => createQuestionEditorModule(), { virtual: true });

try {
  // 1) Canvas shim (prevents canvas errors during DOM tests)
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
  // 2) Dummy providers & TestWrapper
  const AuthContext = React.createContext({});
  const DummyAuthProvider = ({ children }) => <AuthContext.Provider value={{ session: {} }}>{children}</AuthContext.Provider>;

  const DummyRACProvider = ({ children }) => <>{children}</>;

  // attach TestWrapper to global so tests can import if needed
  globalThis.TestWrapper = ({ children }) => (
    <MemoryRouter>
      <DummyAuthProvider>
        <DummyRACProvider>{children}</DummyRACProvider>
      </DummyAuthProvider>
    </MemoryRouter>
  );

  // 3) Global fetch stub for quiz endpoints
  const nativeFetch = typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : async () => ({ ok: false, json: async () => ({}) });

  globalThis.fetch = vi.fn(async (url, opts) => {
    try {
      const s = String(url || "");
      if (s.includes("/.netlify/functions/quiz-pull") || s.includes("/.netlify/functions/get-questions") || s.includes("/api/get-questions")) {
        const items = Array.from({ length: 20 }).map((_, i) => {
          const id = i + 1;
          // <-- IMPORTANT: avoid including the literal substring "question 1" in the text,
          // because tests search for "Question 1" and a body that contains "question 1"
          // can cause duplicate matches. Keep the first item's text distinct.
          const stem =
            i === 0
              ? "Starter stem for first item" // changed from "Dummy question 1"
              : i === 1
              ? "What is lift"
              : `Question ${i + 1}`;
          const choices = ["Option A", "Option B", "Option C", "Option D"];
          return {
            id,
            legacy_id: `legacy-${id}`,
            question_text: stem,
            question_image_url: null,
            answer_key: "A",
            choices,
            choice_images: [null, null, null, null],
            explanations: choices.map((opt, idx) => `Explanation for ${opt} (${idx + 1})`),
            tags: ["practice"],
            difficulty: i % 3 === 0 ? "easy" : "medium",
            category_path: ["aircraft", "systems"],
          };
        });
        return { ok: true, json: async () => ({ items }) };
      }
    } catch (e) {
      // fallback to native
    }
    return nativeFetch(url, opts);
  });

  // 4) Ensure location exists
  if (!globalThis.location) {
    Object.defineProperty(globalThis, "location", {
      value: new URL("http://localhost/"),
      writable: true,
    });
  }

  // 5) Cleanup / reset mocks after each test
  afterEach(() => {
    try {
      cleanup();
    } catch (e) {
      // ignore cleanup errors
    }
    try {
      vi.clearAllMocks?.();
      vi.resetAllMocks?.();
      vi.restoreAllMocks?.();
    } catch (err) {
      // ignore
    }
  });
} catch (outerErr) {
  // If this file itself errors, log to console but avoid crashing the runner with undefined variables
  // eslint-disable-next-line no-console
  console.error("[vitest.setup] setup file error:", outerErr && outerErr.stack ? outerErr.stack : outerErr);
}
