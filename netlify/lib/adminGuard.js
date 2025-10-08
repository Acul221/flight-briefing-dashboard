// lightweight in-memory token bucket
const bucket = new Map();
function rateLimit(key, limit = 40, windowMs = 60_000) {
  const now = Date.now();
  const item = bucket.get(key) ?? { count: 0, ts: now };
  if (now - item.ts > windowMs) { item.count = 0; item.ts = now; }
  item.count++; bucket.set(key, item);
  if (item.count > limit) {
    const e = new Error("Too Many Requests");
    e.status = 429;
    throw e;
  }
}

export function withAdmin(handler, { requireSecret = true, rate = { limit: 40, windowMs: 60_000 } } = {}) {
  return async (req) => {
    try {
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for") ||
        "0.0.0.0";
      if (rate) rateLimit(String(ip), rate.limit, rate.windowMs);

      // allow either secret header OR Supabase profile.is_admin
      const okSecret =
        requireSecret &&
        req.headers.get("x-admin-secret") === process.env.ADMIN_API_SECRET;

      // lazy import to avoid circular
      const { getUserFromReq } = await import("./supa.js");
      const user = await getUserFromReq(req);
      const okBearer = !!user?.is_admin;

      if (!(okSecret || okBearer)) {
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      }

      // pass user downstream
      return await handler(req, { user, ip });
    } catch (err) {
      const status = err.status || 500;
      return new Response(JSON.stringify({ error: err.message || "internal_error" }), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
  };
}
