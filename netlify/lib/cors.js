const ORIGIN = process.env.ADMIN_ALLOWED_ORIGIN?.split(",").map(s=>s.trim()).filter(Boolean) || [];

export function withCors(handler) {
  return async (req, ctx) => {
    const res = await handler(req, ctx);
    const hdrs = new Headers(res.headers);
    const origin = req.headers.get("origin") || "";
    if (ORIGIN.includes(origin)) {
      hdrs.set("Access-Control-Allow-Origin", origin);
      hdrs.set("Vary", "Origin");
    }
    hdrs.set("Access-Control-Allow-Headers", "authorization, x-admin-secret, content-type");
    hdrs.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
      return new Response("", { status: 204, headers: hdrs });
    }
    return new Response(await res.text(), { status: res.status, headers: hdrs });
  };
}
