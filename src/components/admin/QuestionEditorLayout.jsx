// src/components/admin/QuestionEditorLayout.jsx
import { useEffect, useMemo, useState } from "react";
import RawInputParser from "./RawInputParser";
import QuestionFormLayout from "./QuestionFormLayout";
import { apiFetchAuthed } from "@/lib/apiClient";

/* ---------------- helpers ---------------- */

const toStr = (v) => (v == null ? "" : String(v));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUUID = (v) => typeof v === "string" && UUID_RE.test(v);

// detect “Correct/Incorrect” di explanation
const CORRECT_RX = /(^|\s)(✅|✔|✓)?\s*correct\b\s*(?:[-:–—]\s*)?/i;
const INCORRECT_RX =
  /(^|\s)(❌|✖|✕|✗)?\s*in\s*correct\b|\bincorrect\b\s*(?:[-:–—]\s*)?/i;

function cleanExplanation(txt) {
  const s = toStr(txt).trim();
  return s.replace(CORRECT_RX, "").replace(INCORRECT_RX, "").trim();
}

/** Build payload final untuk submit-question (choices = string[]) */
function buildPayload(form, { requiresAircraft }) {
  // Category path "Parent > Child"
  const parentLabel = toStr(form.category).trim();
  const childLabel = toStr(form.subcategory).trim();
  const category_path = [];
  if (parentLabel && childLabel) category_path.push(`${parentLabel} > ${childLabel}`);
  else if (parentLabel) category_path.push(parentLabel);

  // answers -> choices (string[]); explanations dibersihkan
  const rawChoices = Array.from({ length: 4 }, (_, i) => toStr(form.answers?.[i]).trim());
  const rawExpl = Array.from({ length: 4 }, (_, i) => toStr(form.explanations?.[i]).trim());

  const choices = rawChoices; // <— string[], sesuai backend
  let explanations = rawExpl.map(cleanExplanation);

  // correctIndex
  let ci =
    typeof form.correctIndex === "number"
      ? form.correctIndex
      : Number(form.correctIndex ?? -1);
  if (!Number.isFinite(ci)) ci = -1;
  if (ci < 0) {
    for (let i = 0; i < 4; i++) {
      if (CORRECT_RX.test(rawExpl[i])) {
        ci = i; // infer dari “Correct …”
        break;
      }
    }
  }
  if (ci >= 0) ci = clamp(ci, 0, 3);

  // images
  const question_image_url = toStr(form.questionImage).trim() || null;
  const choice_images = Array.from({ length: 4 }, (_, i) => {
    const u = toStr(form.choiceImages?.[i]).trim();
    return u || null;
  });

  // tags
  const tags =
    typeof form.tags === "string"
      ? form.tags
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : Array.isArray(form.tags)
      ? form.tags.filter(Boolean)
      : [];

  // FE validation minimal
  if (choices.filter((t) => t).length < 4) {
    throw new Error("Please fill all four answers (A–D).");
  }
  if (requiresAircraft && !toStr(form.aircraft).trim()) {
    throw new Error("This category requires an Aircraft value.");
  }

  const payload = {
    ...(toStr(form.id).trim() ? { legacy_id: toStr(form.id).trim() } : {}),
    question: toStr(form.question).trim(),
    choices,             // string[]
    explanations,        // string[]
    correctIndex: ci,    // 0..3
    difficulty: toStr(form.level || "medium").trim().toLowerCase(),
    tags,
    source: toStr(form.source).trim(),
    aircraft: toStr(form.aircraft).trim(),
    question_image_url,
    choice_images,       // (string|null)[4]
    category_path,
  };

  return payload;
}

/** Safety pass: pastikan tidak ada object yg bikin 400 (terutama category_ids) */
function sanitizeForSubmit(obj) {
  const clone = JSON.parse(JSON.stringify(obj));
  if (Array.isArray(clone.category_ids)) {
    const onlyUuid = clone.category_ids
      .map((x) => (typeof x === "string" ? x : x?.value || x?.id))
      .filter((s) => isUUID(s));
    if (onlyUuid.length) clone.category_ids = onlyUuid;
    else delete clone.category_ids;
  }
  return clone;
}

/* ---------------- component ---------------- */

export default function QuestionEditorLayout() {
  const [form, setForm] = useState({
    id: "", // legacy_id (Notion)
    category: "",
    subcategory: "",
    question: "",
    answers: ["", "", "", ""],
    explanations: ["", "", "", ""],
    correctIndex: null,
    tags: "",
    level: "medium",
    source: "",
    aircraft: "",
    questionImage: "",
    choiceImages: [null, null, null, null],
  });

  const [categoriesTree, setCategoriesTree] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [msg, setMsg] = useState("");

  // Load category tree
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/.netlify/functions/categories-tree");
        const data = await res.json().catch(() => ({}));
        setCategoriesTree(data?.items || data || []);
      } catch (e) {
        console.error("Failed loading categories-tree", e);
      }
    })();
  }, []);

  const parentNode = useMemo(
    () => categoriesTree.find((p) => p?.label === form.category) || null,
    [categoriesTree, form.category]
  );
  const requiresAircraft = !!parentNode?.requires_aircraft;

  // hasil parse dari blok kiri → isi form kanan
  const handleParse = (parsed) => {
    setForm((prev) => ({
      ...prev,
      id: parsed.id || prev.id,
      category: parsed.category || prev.category,
      subcategory: parsed.subcategory || prev.subcategory,
      question: parsed.question || prev.question,
      answers: parsed.answers?.length ? parsed.answers : prev.answers,
      explanations: parsed.explanations?.length ? parsed.explanations : prev.explanations,
      correctIndex:
        typeof parsed.correctIndex === "number" ? parsed.correctIndex : prev.correctIndex,
      level: parsed.level || prev.level,
      source: parsed.source || prev.source,
      tags:
        Array.isArray(parsed.tags) ? parsed.tags.join(", ") : parsed.tags || prev.tags,
    }));
    setMsg("Parsed. Review on the right, then Save.");
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const doSubmit = async () => {
    setMsg("");
    let payload;
    try {
      payload = buildPayload(form, { requiresAircraft });
    } catch (feErr) {
      setMsg(feErr.message);
      return;
    }

    const safePayload = sanitizeForSubmit(payload);
    console.log("[submit-question] payload:", safePayload);

    const qs = dryRun ? "?dry=1" : "";
    try {
      setSaving(true);
      const data = await apiFetchAuthed(`/.netlify/functions/submit-question${qs}`, {
        method: "POST",
        body: JSON.stringify(safePayload),
      });

      setMsg(
        dryRun
          ? "Dry run OK — mapping valid (no data written)."
          : "Saved! Synced to Notion and mirrored to DB."
      );

      // isi otomatis legacy_id utk update berikutnya
      if (data?.legacy_id && !form.id) {
        setForm((prev) => ({ ...prev, id: data.legacy_id }));
      }
    } catch (e) {
      const text = toStr(e.message);
      if (/validation_failed/i.test(text)) {
        setMsg(
          "Validation failed: set one correct answer (A–D), pastikan 4 choices terisi."
        );
      } else {
        setMsg(text || "Failed to submit question");
      }
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Question Editor (Dual Mode)</h1>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="toggle"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
          />
          Dry Run (validate only)
        </label>
      </div>

      {msg && (
        <div className="alert alert-info mb-3">
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <RawInputParser onParse={handleParse} />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <QuestionFormLayout
              form={form}
              onChange={handleChange}
              onSubmit={doSubmit}
              categoriesTree={categoriesTree}
              saving={saving}
              requiresAircraft={requiresAircraft}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
