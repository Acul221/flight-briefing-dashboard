// src/tests/mocks/supabase.mock.js
import { vi } from "vitest";

vi.mock("@/lib/supabase", () => {
  const auth = {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    signOut: vi.fn(async () => ({ error: null })),
  };
  const rpc = vi.fn(async () => ({ data: [], error: null }));
  const from = vi.fn(() => ({ select: vi.fn(async () => ({ data: [], error: null })) }));
  return { default: { auth, rpc, from } };
});

