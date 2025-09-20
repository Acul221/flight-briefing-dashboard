/* netlify/functions/quiz-pull.js */
const { createClient } = require("@supabase/supabase-js");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
} = process.env;

const sba = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function parseBool(v) {
  return v === true || v === "1" || v === "true";
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

    // INPUTS
    const categorySlug = qs.get("category_slug"); // required
    const parentSlug   = qs.get("parent_slug");   // optional disambiguator
    const includeDesc  = parseBool(qs.get("include_descendants"));
    const difficulty   = qs.get("difficulty");    // easy|medium|hard (optional)
    const aircraftCsv  = (qs.get("aircraft") || "").trim(); // e.g. "A320,A330"
    const strictAcft   = parseBool(qs.get("strict_aircraft"));
    const limit        = Math.min(parseInt(qs.get("limit") || "20", 10) || 20, 200);

    if (!categorySlug) {
      return json(400, { error: "category_slug is required" });
    }

    // 1) Resolve category by slug (+ optional parent_slug)
    let { data: candidates, error: e1 } = await sba
      .from("categories")
      .select("id, slug, parent_id, is_active")
      .eq("slug", categorySlug);

    if (e1) throw e1;
    if (!candidates || candidates.length === 0) {
      return json(200, { items: [], count: 0 });
    }

    // pilih satu
    let catRow = candidates[0];
    if (parentSlug && candidates.length > 1) {
      for (const c of candidates) {
        if (!c.parent_id) continue;
        const { data: p } = await sba
          .from("categories")
          .select("id, slug")
          .eq("id", c.parent_id)
          .single();
        if (p?.slug === parentSlug) {
          catRow = c;
          break;
        }
      }
    }
    const rootId = catRow.id;

    // 2) Kumpulkan subtree id (include_descendants)
    let targetIds = [rootId];
    if (includeDesc) {
      const { data: allCats, error: eCats } = await sba
        .from("categories")
        .select("id, parent_id, is_active");
      if (eCats) throw eCats;

      const byParent = new Map();
      for (const c of (allCats || [])) {
        const k = c.parent_id || "root";
        if (!byParent.has(k)) byParent.set(k, []);
        byParent.get(k).push(c);
      }

      const stack = [rootId];
      const seen = new Set([rootId]);
      while (stack.length) {
        const pid = stack.pop();
        const children = byParent.get(pid) || [];
        for (const ch of children) {
          if (seen.has(ch.id)) continue;
          seen.add(ch.id);
          targetIds.push(ch.id);
          stack.push(ch.id);
        }
      }
    }

    // 3) Ambil question_ids yang punya kategori target
    const { data: links, error: eLinks } = await sba
      .from("question_categories")
      .select("question_id")
      .in("category_id", targetIds);

    if (eLinks) throw eLinks;

    const qIds = Array.from(new Set((links || []).map((x) => x.question_id)));
    if (qIds.length === 0) {
      return json(200, { items: [], count: 0 });
    }

    // 4) Query questions (published)
    let q = sba
      .from("questions")
      .select(`
        id, legacy_id, question_text, question_image_url,
        choices, choice_images, answer_key,
        explanation, explanations,
        difficulty, source, aircraft, tags,
        status
      `)
      .in("id", qIds)
      .eq("status", "published");

    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
      q = q.eq("difficulty", difficulty);
    }

    // 5) Filter aircraft jika diisi
    if (aircraftCsv) {
      const req = aircraftCsv
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // NOTE: kolom aircraft bertipe text berisi CSV (e.g. "A320,A330").
      // Strict: semua token harus match; non-strict: minimal salah satu.
      if (req.length) {
        if (strictAcft) {
          for (const token of req) {
            q = q.ilike("aircraft", `%${token}%`);
          }
        } else {
          // non-strict pakai or
          const ors = req.map((t) => `aircraft.ilike.%${t}%`).join(",");
          q = q.or(ors);
        }
      }
    }

    const { data: rows, error: eQ } = await q;
    if (eQ) throw eQ;

    // 6) Shuffle + limit
    let items = shuffle(rows || []).slice(0, limit);

    // 7) Bentuk output minimal-compatible (jika FE butuh bentuk tertentu)
    const out = items.map((r) => ({
      id: r.id,
      legacy_id: r.legacy_id,
      question: r.question_text,
      image: r.question_image_url || null,
      choices: ["A", "B", "C", "D"].map((L) => r.choices?.[L] ?? ""),
      choiceImages: Array.isArray(r.choice_images) ? r.choice_images : null,
      correctIndex: ({ A: 0, B: 1, C: 2, D: 3 }[r.answer_key] ?? 0),
      explanation: r.explanation || r.explanations?.[({ A: 0, B: 1, C: 2, D: 3 }[r.answer_key] ?? 0)] || "",
      explanations: r.explanations || null,
      difficulty: r.difficulty,
      source: r.source,
      aircraft: r.aircraft,
      tags: r.tags || [],
    }));

    return json(200, { items: out, count: out.length, category_id: rootId, include_descendants: !!includeDesc });
  } catch (e) {
    console.error("quiz-pull error:", e);
    return json(500, { error: e.message || String(e) });
  }
};
