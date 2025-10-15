/* eslint-disable no-case-declarations */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  ADMIN_API_SECRET,
  ADMIN_ALLOWED_ORIGIN
} = process.env;

const CORS = {
  "Access-Control-Allow-Origin": ADMIN_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Secret, x-admin-secret",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

let _sb;
async function sbAdmin() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });
  return _sb;
}

function slugify(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdmin(event) {
  const secret =
    event.headers?.["x-admin-secret"] ||
    event.headers?.["X-Admin-Secret"] ||
    event.headers?.["x-adminsecret"];
  if (!secret || secret !== ADMIN_API_SECRET) throw new Error("not_admin");
  return true;
}

const isUUID = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  try {
    const s = await sbAdmin();

    switch (event.httpMethod) {
      /* ---------------------- LIST ---------------------- */
      case "GET": {
        const qs = event.queryStringParameters || {};
        const parentSlug = qs.parent_slug ? String(qs.parent_slug).toLowerCase() : null;

        const { data, error } = await s.rpc("fn_get_categories_v3", {
          p_parent_slug: parentSlug || null,
        });
        if (error) throw error;

        const categories = Array.isArray(data) ? data : [];
        return json(200, {
          success: true,
          parent_slug: parentSlug || null,
          count: categories.length,
          categories,
        });
      }

      /* ---------------------- CREATE ---------------------- */
      case "POST": {
        await requireAdmin(event);
        const body = JSON.parse(event.body || "{}");
        const rawLabel = String(body.label || "").trim();
        if (!rawLabel) return json(400, { error: "label_required" });

        // optional parent by slug
        let parent_id = null;
        if (body.parent_slug) {
          const { data: parent } = await s
            .from("categories")
            .select("id")
            .eq("slug", String(body.parent_slug).toLowerCase())
            .maybeSingle();
          parent_id = parent?.id || null;
        }

        const slug = slugify(rawLabel);

        // prevent duplicate under same parent
        const { data: exists } = await s
          .from("categories")
          .select("id")
          .eq("slug", slug)
          .eq("parent_id", parent_id)
          .maybeSingle();
        if (exists) return json(409, { error: "duplicate", slug });

        const { data, error } = await s
          .from("categories")
          .insert({ label: rawLabel, slug, parent_id })
          .select()
          .single();
        if (error) throw error;
        return json(200, data);
      }

      /* ---------------------- DELETE ---------------------- */
      case "DELETE": {
        await requireAdmin(event);
        const qs = event.queryStringParameters || {};
        const id = qs.id;
        if (!isUUID(id)) return json(400, { error: "invalid_id" });

        // 1) cek ada child?
        const { data: child } = await s
          .from("categories")
          .select("id")
          .eq("parent_id", id)
          .limit(1);
        if (child && child.length) {
          return json(409, { error: "category_has_children" });
        }

        // 2) cek dipakai soal?
        const { data: used } = await s
          .from("question_categories")
          .select("question_id")
          .eq("category_id", id)
          .limit(1);
        if (used && used.length) {
          return json(409, { error: "category_in_use" });
        }

        // 3) delete
        const { error } = await s.from("categories").delete().eq("id", id);
        if (error) throw error;
        return json(200, { ok: true, id });
      }

      default:
        return json(405, { error: "method_not_allowed" });
    }
  } catch (err) {
    console.error("categories.js error:", err);
    const message = err?.message || "internal_error";
    const code = message === "not_admin" ? 401 : 500;
    return json(code, { error: message });
  }
};
