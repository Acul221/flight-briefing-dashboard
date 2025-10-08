export default async (request, context) => {
  const url = new URL(request.url);
  const isAdminFn =
    url.pathname.startsWith("/.netlify/functions/notion-import") ||
    url.pathname.startsWith("/.netlify/functions/submit-question") ||
    url.pathname.startsWith("/.netlify/functions/questions") ||
    url.pathname.startsWith("/.netlify/functions/categories");

  if (!isAdminFn) return context.next();

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
