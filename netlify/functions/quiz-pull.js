// netlify/functions/quiz-pull.js
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-admin-secret",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const ok = (b) => ({ statusCode: 200, headers: CORS, body: JSON.stringify(b) });
const bad = (c, m) => ({ statusCode: c, headers: CORS, body: JSON.stringify({ error: m }) });

let _sb;
async function sb() {
  if (_sb) return _sb;
  const { createClient } = await import("@supabase/supabase-js");
  _sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  return _sb;
}

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function getCategoryBySlug(slug) {
  const s = await sb();
  const { data, error } = await s
    .from("categories")
    .select("id, parent_id")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function getDescendantIds(rootId) {
  const s = await sb();
  const ids = new Set([rootId]);
  let frontier = [rootId];
  while (frontier.length) {
    const { data, error } = await s
      .from("categories")
      .select("id")
      .in("parent_id", frontier);
    if (error) throw error;
    const next = (data || []).map((r) => r.id).filter((id) => !ids.has(id));
    next.forEach((id) => ids.add(id));
    frontier = next;
  }
  return [...ids];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS")
      return { statusCode: 204, headers: CORS, body: "" };
    if (event.httpMethod !== "GET")
      return bad(405, "method_not_allowed");

    const s = await sb();

    const qs = event.queryStringParameters || {};
    const categorySlug = slugify(qs.category || qs.category_slug || "");
    const includeDesc = !(qs.include_descendants === "0" || qs.include_descendants === "false");
    const limit = Math.min(Math.max(parseInt(qs.limit || "20", 10), 1), 100);
    const aircraft = (qs.aircraft || "").toLowerCase().trim() || null;
    const strictAircraft = qs.strict_aircraft === "1" || qs.strict_aircraft === "true";
    const diffs = (qs.difficulty || qs.difficulties || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter((x) => x && ["easy", "medium", "hard"].includes(x));

    if (!categorySlug) return bad(400, "category_slug_required");

    const root = await getCategoryBySlug(categorySlug);
    if (!root) return bad(404, "category_not_found");

    const catIds = includeDesc ? await getDescendantIds(root.id) : [root.id];

    // ambil semua question_id dari kategori tersebut
    const { data: qc, error: e1 } = await s
      .from("question_categories")
      .select("question_id")
      .in("category_id", catIds);
    if (e1) return bad(500, e1.message);

    const qIds = [...new Set((qc || []).map((r) => r.question_id))];
    if (!qIds.length) return ok({ items: [] });

    // ambil kandidat published
    let q = s
      .from("questions")
      .select(
        "id, legacy_id, question_text, question_image_url, choices, choice_images, answer_key, explanation, explanations, difficulty, tags, source, aircraft, status"
      )
      .in("id", qIds)
      .eq("status", "published");

    if (diffs.length) q = q.in("difficulty", diffs);
    if (aircraft) {
      if (strictAircraft) q = q.eq("aircraft", aircraft);
      else q = q.or(`aircraft.eq.${aircraft},aircraft.is.null`);
    }

    // fetch up to 400 then shuffle in memory
    const { data: rows, error: e2 } = await q.limit(400);
    if (e2) return bad(500, e2.message);

    const shuffled = shuffle(rows || []).slice(0, limit);

    const items = (shuffled || []).map((r) => {
      const choices = r.choices || {};
      const imgs = r.choice_images || {};
      const abc = ["A", "B", "C", "D"];
      const correctIndex = Math.max(0, abc.indexOf(r.answer_key || "A"));
      return {
        id: r.id,
        legacy_id: r.legacy_id,
        question: r.question_text,
        image: r.question_image_url || null,
        choices: [choices.A, choices.B, choices.C, choices.D],
        choiceImages: [imgs.A || null, imgs.B || null, imgs.C || null, imgs.D || null],
        correctIndex,
        explanation: r.explanation || (r.explanations ? r.explanations[abc[correctIndex]] : "") || "",
        difficulty: r.difficulty,
        tags: r.tags || [],
        source: r.source || null,
        aircraft: r.aircraft || null,
      };
    });

    return ok({ items });
  } catch (e) {
    return bad(500, e.message || String(e));
  }
};
