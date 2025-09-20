// netlify/functions/categories.js
/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");

const {
  ADMIN_API_SECRET,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
} = process.env;

const sba = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function slugifyLabel(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function requireAdmin(event) {
  // Option 1: x-admin-secret
  const xadm = event.headers?.["x-admin-secret"]
    || event.headers?.["X-Admin-Secret"]
    || event.headers?.["x-Admin-Secret"];
  if (xadm && ADMIN_API_SECRET && xadm === ADMIN_API_SECRET) {
    return { via: "secret" };
  }

  // Option 2: Bearer token -> profiles.is_admin
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) throw new Error("forbidden");

  const { data: userData, error: e1 } = await sba.auth.getUser(token);
  if (e1 || !userData?.user) throw new Error("invalid_token");

  const uid = userData.user.id;
  const { data: prof, error: e2 } = await sba.from("profiles")
    .select("is_admin").eq("id", uid).single();
  if (e2 || !prof?.is_admin) throw new Error("forbidden");
  return { via: "bearer", uid };
}

function mapPgError(err) {
  const msg = err?.message || String(err || "");
  // Uniqueness (root vs child)
  if (/categories_root_slug_unq/i.test(msg) || /duplicate key.*root/i.test(msg)) {
    return "duplicate_root_slug: slug pada root sudah dipakai.";
  }
  if (/categories_parent_slug_unq/i.test(msg) || /duplicate key.*parent_id/i.test(msg)) {
    return "duplicate_child_slug: slug pada parent yang sama sudah dipakai.";
  }
  // Check constraint pada slug
  if (/categories_slug_check/i.test(msg)) {
    return "invalid_slug: slug harus huruf kecil/angka/dash dan tidak boleh kosong.";
  }
  return null;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS, body: "" };
    }

    // GET (list)
    if (event.httpMethod === "GET") {
      const url = new URL(event.rawUrl || `http://x${event.path}${event.queryString || ""}`);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 500);
      const order = url.searchParams.get("order") || "label.asc";
      let q = sba.from("categories").select("*").order(order.split(".")[0], { ascending: !order.endsWith(".desc") }).limit(limit);
      const parentId = url.searchParams.get("parent_id");
      if (parentId === "null") q = q.is("parent_id", null);
      else if (parentId) q = q.eq("parent_id", parentId);
      const { data, error } = await q;
      if (error) throw error;
      return json(200, { items: data || [] });
    }

    // Semua write butuh admin
    await requireAdmin(event);

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const label = String(body.label || "").trim();
      if (!label) return json(400, { error: "label_required" });

      const parent_id = body.parent_id || null;
      const requires_aircraft = !!body.requires_aircraft;
      const pro_only = !!body.pro_only;
      const is_active = body.is_active !== false;
      const order_index = Number(body.order_index || 0);

      // slugify di server!
      const slug = slugifyLabel(label);
      if (!slug) return json(400, { error: "invalid_slug: hasil slug kosong" });

      const { data, error } = await sba.from("categories")
        .insert({ label, slug, parent_id, requires_aircraft, pro_only, is_active, order_index })
        .select().single();
      if (error) {
        const mapped = mapPgError(error);
        throw new Error(mapped || error.message);
      }
      return json(200, { item: data });
    }

    if (event.httpMethod === "PUT") {
      const url = new URL(event.rawUrl || `http://x${event.path}${event.queryString || ""}`);
      const id = url.searchParams.get("id");
      if (!id) return json(400, { error: "id_required" });

      const body = JSON.parse(event.body || "{}");
      const patch = {};
      if (typeof body.label === "string") {
        patch.label = body.label.trim();
        patch.slug = slugifyLabel(patch.label);
        if (!patch.slug) return json(400, { error: "invalid_slug: hasil slug kosong" });
      }
      if ("parent_id" in body) patch.parent_id = body.parent_id || null;
      if ("requires_aircraft" in body) patch.requires_aircraft = !!body.requires_aircraft;
      if ("pro_only" in body) patch.pro_only = !!body.pro_only;
      if ("is_active" in body) patch.is_active = !!body.is_active;
      if ("order_index" in body) patch.order_index = Number(body.order_index || 0);

      const { data, error } = await sba.from("categories")
        .update(patch).eq("id", id).select().single();
      if (error) {
        const mapped = mapPgError(error);
        throw new Error(mapped || error.message);
      }
      return json(200, { item: data });
    }

    if (event.httpMethod === "DELETE") {
      const url = new URL(event.rawUrl || `http://x${event.path}${event.queryString || ""}`);
      const id = url.searchParams.get("id");
      if (!id) return json(400, { error: "id_required" });

      // Hapus relasi di junction dulu (aman jika tidak ada)
      await sba.from("question_categories").delete().eq("category_id", id);
      const { error } = await sba.from("categories").delete().eq("id", id);
      if (error) throw error;
      return json(200, { ok: true });
    }

    return json(405, { error: "method_not_allowed" });
  } catch (e) {
    console.error("categories error:", e);
    return json(500, { error: e.message || String(e) });
  }
};
