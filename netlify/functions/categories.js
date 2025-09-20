// netlify/functions/categories.js  — CommonJS + dynamic import ESM
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_ANON_KEY } = process.env;

const CORS = {
  "Access-Control-Allow-Origin": "*", // set ke domain kamu jika mau
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(statusCode, body) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

function buildTree(rows) {
  const map = new Map();
  rows.forEach((r) => map.set(r.id, { ...r, children: [] }));
  const roots = [];
  rows.forEach((r) => {
    if (r.parent_id && map.has(r.parent_id)) map.get(r.parent_id).children.push(map.get(r.id));
    else roots.push(map.get(r.id));
  });
  const sortRec = (n) => {
    if (n.children?.length) {
      n.children.sort((a, b) => a.order_index - b.order_index);
      n.children.forEach(sortRec);
    }
  };
  roots.sort((a, b) => a.order_index - b.order_index);
  roots.forEach(sortRec);
  return roots;
}

// cache client admin supaya tidak buat ulang tiap request
let _admin;
async function getAdmin() {
  if (_admin) return _admin;
  const { createClient } = await import("@supabase/supabase-js");
  _admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  return _admin;
}

async function requireAdmin(event) {
  const token = event.headers?.authorization?.replace("Bearer ", "");
  if (!token) return { ok: false, why: "missing_token" };

  const { createClient } = await import("@supabase/supabase-js");
  const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: userErr,
  } = await asUser.auth.getUser();
  if (userErr || !user) return { ok: false, why: "invalid_token" };

  const admin = await getAdmin();
  const { data: prof, error: profErr } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profErr || !prof?.is_admin) return { ok: false, why: "forbidden" };
  return { ok: true, user };
}

exports.handler = async (event) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE || !SUPABASE_ANON_KEY) {
      console.warn("[categories] Missing Supabase env(s)");
    }

    if (event.httpMethod === "OPTIONS")
      return { statusCode: 204, headers: CORS, body: "" };

    const method = event.httpMethod;
    const admin = await getAdmin();

    if (method === "GET") {
      const wantTree =
        event.queryStringParameters?.tree === "1" ||
        event.queryStringParameters?.tree === "true";

      const { data, error } = await admin
        .from("categories")
        .select(
          "id, slug, label, parent_id, requires_aircraft, pro_only, icon, color, order_index, is_active"
        )
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) return json(500, { error: error.message });
      return json(200, { items: wantTree ? buildTree(data) : data });
    }

    if (method === "POST") {
      const auth = await requireAdmin(event);
      if (!auth.ok) return json(401, { error: auth.why });

      const body = JSON.parse(event.body || "{}");
      const payload = {
        slug: String(body.slug || "")
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .replace(/^-+|-+$/g, ""),
        label: body.label,
        parent_id: body.parent_id || null,
        requires_aircraft: !!body.requires_aircraft,
        pro_only: !!body.pro_only,
        icon: body.icon || null,
        color: body.color || null,
        order_index: Number.isFinite(body.order_index) ? body.order_index : 0,
        is_active: body.is_active ?? true,
        created_by: auth.user.id,
      };

      const { data, error } = await admin
        .from("categories")
        .insert(payload)
        .select()
        .single();
      if (error) return json(500, { error: error.message });
      return json(201, { item: data });
    }

    if (method === "PATCH") {
      const auth = await requireAdmin(event);
      if (!auth.ok) return json(401, { error: auth.why });

      const id = event.queryStringParameters?.id;
      if (!id) return json(400, { error: "missing id" });

      const body = JSON.parse(event.body || "{}");
      delete body.id;
      const updates = { ...body, updated_at: new Date().toISOString() };

      const { data, error } = await admin
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) return json(500, { error: error.message });
      return json(200, { item: data });
    }

    if (method === "DELETE") {
      const auth = await requireAdmin(event);
      if (!auth.ok) return json(401, { error: auth.why });

      const id = event.queryStringParameters?.id;
      if (!id) return json(400, { error: "missing id" });

      const { error } = await admin.from("categories").delete().eq("id", id);
      if (error) return json(500, { error: error.message });
      return json(200, { ok: true });
    }

    return json(405, { error: "method_not_allowed" });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
