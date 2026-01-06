export default async (request, context) => {
  const url = new URL(request.url);
  const allowedFns = [
    "/.netlify/functions/submit-question",
    "/.netlify/functions/quiz-pull",
    "/.netlify/functions/rpc-health",
  ];
  const isFunction = url.pathname.startsWith("/.netlify/functions/");
  const isAdminFn = allowedFns.some((p) => url.pathname.startsWith(p));

  // Block any other function endpoints
  if (isFunction && !isAdminFn) {
    return new Response(JSON.stringify({ error: "blocked" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Allowlist origin (admin only)
  const origin = request.headers.get("origin") || "";
  const allow = (Deno.env.get("ADMIN_ALLOWED_ORIGIN") || "").split(",").map(s=>s.trim());
  if (allow.length && origin && !allow.includes(origin)) {
    return new Response(JSON.stringify({ error: "forbidden_origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Simple IP bucket (memory)
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const bucket = context.cookies.get(key);
  let c = 0, ts = now;
  if (bucket) {
    const [cStr, tsStr] = bucket.split("|");
    c = parseInt(cStr, 10) || 0;
    ts = parseInt(tsStr, 10) || now;
    if (now - ts > 60_000) { c = 0; ts = now; }
  }
  c++;
  context.cookies.set(key, `${c}|${ts}`, { path: "/", httpOnly: true, secure: true, sameSite: "Lax" });
  if (c > 120) return new Response(JSON.stringify({ error: "too_many_requests" }), { status: 429 });

  return context.next();
}
