import { describe, it, expect, vi, beforeEach } from "vitest";

const makeFetchResponse = (status: number, jsonBody: any) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(jsonBody),
});

const baseHeaders = {
  authorization: "Bearer test-token",
};

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-key";
});

describe("exam-attempt", () => {
  it("rejects missing auth", async () => {
    globalThis.fetch = vi.fn();
    const { handler } = await import("../netlify/functions/exam-attempt.js");
    const res = await handler({ httpMethod: "POST", headers: {}, body: "{}" });
    expect(res.statusCode).toBe(401);
  });

  it("submits via RPC with anon key + Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse(200, "attempt-123"));
    globalThis.fetch = fetchMock;
    const { handler } = await import("../netlify/functions/exam-attempt.js");
    const res = await handler({
      httpMethod: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        subject_slug: "a320",
        answers: [{ selected_index: 1, correct_index: 1 }],
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/rpc/fn_submit_exam_attempt",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          apikey: "anon-key",
          Authorization: "Bearer test-token",
        }),
      })
    );
  });
});

describe("exam-attempts", () => {
  it("requires auth before listing attempts", async () => {
    globalThis.fetch = vi.fn();
    const { handler } = await import("../netlify/functions/exam-attempts.js");
    const res = await handler({ httpMethod: "GET", headers: {}, queryStringParameters: { subject: "a320" } });
    expect(res.statusCode).toBe(401);
  });
});

describe("question-flag", () => {
  it("requires auth and posts RPC", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeFetchResponse(200, "flag-id"));
    globalThis.fetch = fetchMock;
    const { handler } = await import("../netlify/functions/question-flag.js");
    const res = await handler({
      httpMethod: "POST",
      headers: baseHeaders,
      body: JSON.stringify({ question_id: "q1", reason: "bad wording" }),
    });
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/rpc/fn_submit_question_flag",
      expect.objectContaining({
        headers: expect.objectContaining({ apikey: "anon-key", Authorization: "Bearer test-token" }),
      })
    );
  });
});

describe("question-flags", () => {
  it("requires auth header", async () => {
    globalThis.fetch = vi.fn();
    const { handler } = await import("../netlify/functions/question-flags.js");
    const res = await handler({ httpMethod: "GET", headers: {}, queryStringParameters: {} });
    expect(res.statusCode).toBe(401);
  });
});

describe("question-flag-resolve", () => {
  it("rejects missing auth", async () => {
    globalThis.fetch = vi.fn();
    const { handler } = await import("../netlify/functions/question-flag-resolve.js");
    const res = await handler({ httpMethod: "POST", headers: {}, body: "{}" });
    expect(res.statusCode).toBe(401);
  });
});
