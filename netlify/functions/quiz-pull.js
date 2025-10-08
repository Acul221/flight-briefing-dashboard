/* netlify/functions/quiz-pull.js */
const { createClient } = require("@supabase/supabase-js");

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE,
  PUBLIC_ALLOWED_ORIGIN,  // e.g. "https://app.skydeckpro.id,https://www.skydeckpro.id"
} = process.env;

const sba = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// CORS untuk endpoint publik (quiz runtime)
const CORS = {
  "Access-Control-Allow-Origin": PUBLIC_ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

function json(status, body) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}

function parseBool(v) {
  return v === true || v === "1" || (typeof v === "string" && v.toLowerCase() === "true");
}

// Deterministic shuffle (opsional) via mulberry32
function seededShuffle(arr, seed) {
  if (seed == null || Number.isNaN(seed)) return shuffle(arr);
  let t = Math.imul(seed ^ 0x6D2B79F5, 1) | 0;
  const rnd = () => ((t = Math.imul(t ^ (t >>> 15), t | 1)) >>> 0) / 4294967296;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Ambil descendants via RPC; fallback BFS
async function getDescendantIds(rootId) {
  if (!rootId) return [];
  try {
    const { data, error } = await sba.rpc("fn_category_descendants", { p_root: rootId });
    if (!error && Array.isArray(data) && data.length) return data;
  } catch (_) {}
  // Fallback BFS
  const { data: cats, error } = await sba.from("categories").select("id,parent_id");
  if (error) throw error;
  const byParent = {};
  (cats || []).forEach((c) => {
    const key = c.parent_id || "null";
    (byParent[key] ||= []).push(c.id);
  });
  const out = new Set([rootId]); const q = [rootId];
  while (q.length) {
    const cur = q.shift();
    for (const ch of (byParent[cur] || [])) {
      if (!out.has(ch)) { out.add(ch); q.push(ch); }
    }
  }
  return Array.from(out);
}

// --- helper normalisasi teks (string atau {text}) ---
function toText(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v.text ?? v.value ?? v.label ?? "");
  return String(v);
}
function to4(arrLike) {
  const arr = Array.isArray(arrLike) ? arrLike.slice(0, 4) : [];
  while (arr.length < 4) arr.push(null);
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
    const categorySlug = (qs.get("category_slug") || "").trim().toLowerCase(); // required
    const parentSlug   = (qs.get("parent_slug") || "").trim().toLowerCase();   // optional disambiguator
    const includeDesc  = parseBool(qs.get("include_descendants"));
    const difficulty   = (qs.get("difficulty") || "").toLowerCase(); // easy|medium|hard
    const aircraftCsv  = (qs.get("aircraft") || "").trim(); // e.g. "A320,A330"
    const strictAcft   = parseBool(qs.get("strict_aircraft"));
    const limit        = Math.min(parseInt(qs.get("limit") || "20", 10) || 20, 200);
    const seedParam    = qs.get("seed"); // optional deterministic shuffle
    const seed         = seedParam ? parseInt(seedParam, 10) : null;
    const debug        = parseBool(qs.get("debug"));

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
      return json(200, { items: [], count: 0, reason: "category_not_found" });
    }

    // Disambiguate by parent if needed
    let catRow = candidates[0];
    if (parentSlug && candidates.length > 1) {
      for (const c of candidates) {
        if (!c.parent_id) continue;
        const { data: p } = await sba
          .from("categories")
          .select("id, slug")
          .eq("id", c.parent_id)
          .single();
        if (p?.slug === parentSlug) { catRow = c; break; }
      }
    }
    const rootId = catRow.id;

    // 2) Subtree target
    let targetIds = [rootId];
    if (includeDesc) {
      targetIds = await getDescendantIds(rootId);
    }

    // 3) Ambil question_ids yang punya kategori target
    const { data: links, error: eLinks } = await sba
      .from("question_categories")
      .select("question_id")
      .in("category_id", targetIds);

    if (eLinks) throw eLinks;

    const qIds = Array.from(new Set((links || []).map((x) => x.question_id)));
    if (qIds.length === 0) {
      const base = { items: [], count: 0, category_id: rootId, include_descendants: !!includeDesc };
      return debug ? json(200, { ...base, _debug: { targetIds, qIdsLen: 0, filters: { difficulty, aircraftCsv, strictAcft } } }) : json(200, base);
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

    if (["easy","medium","hard"].includes(difficulty)) {
      q = q.eq("difficulty", difficulty);
    }

    // 5) Filter aircraft
    const req = aircraftCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (req.length) {
      if (strictAcft) {
        // STRICT: hanya rows yang punya aircraft yang mengandung salah satu token (OR); exclude null
        const ors = req.map((t) => `aircraft.ilike.%${t}%`).join(",");
        q = q.or(ors);
      } else {
        // NON-STRICT: rows yang match OR rows general (null)
        const ors = req.map((t) => `aircraft.ilike.%${t}%`).concat(["aircraft.is.null"]).join(",");
        q = q.or(ors);
      }
    } else if (strictAcft) {
      // strict tapi tidak ada pilihan aircraft -> 0
      const base = { items: [], count: 0, category_id: rootId, include_descendants: !!includeDesc };
      return debug ? json(200, { ...base, _debug: { reason: "strict_no_aircraft", targetIds, qIdsLen: qIds.length } }) : json(200, base);
    }

    const { data: rows, error: eQ } = await q;
    if (eQ) throw eQ;

    // 6) Shuffle (+seed) + limit
    const pool = rows || [];
    const picked = seededShuffle(pool.slice(), seed).slice(0, limit);

    // 7) Bentuk output
    const mapLetter = { A: 0, B: 1, C: 2, D: 3 };
    const out = picked.map((r) => {
      const choicesArr = ["A","B","C","D"].map((L) => toText(r.choices?.[L]));

      // choice_images bisa array atau object lama {A:...,B:...}
      let imgs = r.choice_images;
      if (!Array.isArray(imgs)) imgs = ["A","B","C","D"].map((L) => r.choice_images?.[L] ?? null);
      const choiceImagesArr = to4(imgs).map((x) => (x ? String(x) : null));

      // explanations bisa array atau object lama {A:...,B:...}
      let exps = r.explanations;
      if (!Array.isArray(exps)) exps = ["A","B","C","D"].map((L) => r.explanations?.[L] ?? "");
      const explanationsArr = to4(exps).map(toText);

      const cidx = mapLetter[r.answer_key] ?? 0;
      const explanation = r.explanation ? String(r.explanation) : (explanationsArr[cidx] || "");

      return {
        id: r.id,
        legacy_id: r.legacy_id,
        question: String(r.question_text || ""),
        image: r.question_image_url || null,
        choices: choicesArr,            // array of string
        choiceImages: choiceImagesArr,  // [string|null]*4
        correctIndex: cidx,
        explanation,                    // single
        explanations: explanationsArr,  // array of string
        difficulty: r.difficulty,
        source: r.source,
        aircraft: r.aircraft,
        tags: Array.isArray(r.tags) ? r.tags : [],
      };
    });

    const base = {
      items: out,
      count: out.length,
      category_id: rootId,
      include_descendants: !!includeDesc
    };

    return debug
      ? json(200, { ...base, _debug: { targetIds, qIdsLen: qIds.length, filters: { difficulty, aircraftCsv, strictAcft }, seed } })
      : json(200, base);

  } catch (e) {
    console.error("quiz-pull error:", e);
    return json(500, { error: e.message || String(e) });
  }
};
