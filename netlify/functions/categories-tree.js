// netlify/functions/categories-tree.js
/* eslint-disable no-console */
const { createClient } = require("@supabase/supabase-js");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  PUBLIC_ALLOWED_ORIGIN, // e.g. "https://app.skydeckpro.id,https://www.skydeckpro.id"
} = process.env;

const sba = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": PUBLIC_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Content-Type": "application/json",
  // kategori berubah jarang → boleh cache tipis di edge/browser
  "Cache-Control": "public, max-age=60, s-maxage=120",
};

const json = (status, body) => ({ statusCode: status, headers: CORS, body: JSON.stringify(body) });

function sortChildren(a, b) {
  const ai = Number.isFinite(a.order_index) ? a.order_index : 0;
  const bi = Number.isFinite(b.order_index) ? b.order_index : 0;
  if (ai !== bi) return ai - bi;
  return String(a.label || "").localeCompare(String(b.label || ""), "en");
}

function buildTree(rows, { countMap = null, aggregate = false, rootFilter = null } = {}) {
  const byId = new Map();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [], count: 0, agg_count: 0 }));

  // direct count
  if (countMap) {
    for (const [cid, cnt] of countMap.entries()) {
      const node = byId.get(cid);
      if (node) node.count = cnt;
    }
  }

  const roots = [];
  rows.forEach((r) => {
    const node = byId.get(r.id);
    if (r.parent_id && byId.has(r.parent_id)) {
      byId.get(r.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  });

  // sort recursively
  const sortRec = (n) => {
    n.children.sort(sortChildren);
    n.children.forEach(sortRec);
  };
  roots.sort(sortChildren);
  roots.forEach(sortRec);

  // aggregate counts (sum descendants) if requested
  if (aggregate) {
    const dfs = (n) => {
      let sum = n.count || 0;
      for (const ch of n.children) sum += dfs(ch);
      n.agg_count = sum;
      return sum;
    };
    roots.forEach(dfs);
  }

  if (rootFilter) {
    // return only subtree(s) that match given root ids
    const set = new Set(Array.isArray(rootFilter) ? rootFilter : [rootFilter]);
    const picked = [];
    const pickRec = (list) => {
      for (const n of list) {
        if (set.has(n.id)) picked.push(n);
        pickRec(n.children);
      }
    };
    pickRec(roots);
    return picked.length ? picked : [];
  }

  return roots;
}

async function getCategoryIdBySlug(slug) {
  if (!slug) return null;
  const { data, error } = await sba
    .from("categories")
    .select("id")
    .eq("slug", String(slug).toLowerCase())
    .limit(1)
    .single();
  if (error) return null;
  return data?.id || null;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: CORS, body: "" };
    }
    if (event.httpMethod !== "GET") {
      return json(405, { error: "method_not_allowed" });
    }

    const url = new URL(event.rawUrl);
    const qs = url.searchParams;

    const includeInactive = qs.get("include_inactive") === "1";
    const rootOnly        = qs.get("root_only") === "1";       // hanya root items (tanpa children) — optional
    const includeCounts   = qs.get("include_counts") === "1";  // hitung jumlah soal per kategori
    const countMode       = (qs.get("count_mode") || "aggregate").toLowerCase(); // "direct" | "aggregate"
    const statusFilter    = (qs.get("question_status") || "published").toLowerCase(); // utk counts
    const aircraft        = (qs.get("aircraft") || "").trim(); // utk counts (opsional)
    const parentSlug      = qs.get("parent_slug") || null;     // kembalikan subtree dari parentSlug
    const parentIdParam   = qs.get("parent_id") || null;       // alternatif subtree via id

    // 1) ambil semua kategori (aktif saja by default) agar bisa build tree utuh
    let q = sba.from("categories").select("*");
    if (!includeInactive) q = q.eq("is_active", true);
    q = q.order("order_index", { ascending: true }).order("label", { ascending: true });
    const { data: cats, error: eCats } = await q;
    if (eCats) throw eCats;

    if (!cats?.length) return json(200, { items: [] });

    // 2) (opsional) siapkan peta jumlah soal per kategori
    let countMap = null;
    if (includeCounts) {
      // direct counts: per category_id (tanpa children),
      // aggregated: akan dijumlahkan di buildTree (count_mode=aggregate)
      let qq = sba
        .from("question_categories")
        .select("category_id, questions!inner(id, status, aircraft)", { head: false });

      // filter status (default published)
      if (statusFilter) {
        qq = qq.eq("questions.status", statusFilter);
      }

      // filter aircraft untuk counts (strict OR general-null sesuai quiz-pull non-strict)
      if (aircraft) {
        // non-strict: match aircraft OR questions.aircraft is null
        qq = qq.or(`questions.aircraft.ilike.%${aircraft}%,questions.aircraft.is.null`);
      }

      const { data: rows, error: eCnt } = await qq;
      if (eCnt) throw eCnt;

      countMap = new Map();
      for (const r of rows || []) {
        const cid = r.category_id;
        countMap.set(cid, (countMap.get(cid) || 0) + 1);
      }
    }

    // 3) kalau minta subtree, resolve parent id dari slug/id yang diberikan
    let subtreeId = null;
    if (parentSlug) subtreeId = await getCategoryIdBySlug(parentSlug);
    if (!subtreeId && parentIdParam) subtreeId = parentIdParam;

    // 4) build tree; kalau minta only subtree, filter sesudah build
    const aggregate = includeCounts && countMode === "aggregate";
    const fullTree = buildTree(cats, {
      countMap,
      aggregate,
      rootFilter: subtreeId ? [subtreeId] : null,
    });

    if (rootOnly) {
      // flatten hanya root nodes; buang children utk quick menu
      const roots = fullTree.map(({ children, ...rest }) => rest);
      return json(200, { items: roots });
    }

    return json(200, { items: fullTree });
  } catch (e) {
    console.error("categories-tree error:", e);
    return json(500, { error: e.message || String(e) });
  }
};
