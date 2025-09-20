// src/hooks/useQuestions.js
import { useEffect, useState, useCallback } from "react";
import { apiFetch, supabase } from "@/lib/apiClient";

/* ---------- helpers ---------- */
function toChoicesObj(choices) {
  if (!choices) return { A: "", B: "", C: "", D: "" };
  if (Array.isArray(choices)) {
    return { A: choices[0], B: choices[1], C: choices[2], D: choices[3] };
  }
  // already object
  return {
    A: choices.A ?? "",
    B: choices.B ?? "",
    C: choices.C ?? "",
    D: choices.D ?? "",
  };
}

function toChoiceImagesObj(choiceImages) {
  if (!choiceImages) return { A: null, B: null, C: null, D: null };
  if (Array.isArray(choiceImages)) {
    return {
      A: choiceImages[0] || null,
      B: choiceImages[1] || null,
      C: choiceImages[2] || null,
      D: choiceImages[3] || null,
    };
  }
  return {
    A: choiceImages.A ?? null,
    B: choiceImages.B ?? null,
    C: choiceImages.C ?? null,
    D: choiceImages.D ?? null,
  };
}

function toExplanationsObj(exps) {
  if (!exps) return { A: "", B: "", C: "", D: "" };
  if (Array.isArray(exps)) {
    return { A: exps[0] || "", B: exps[1] || "", C: exps[2] || "", D: exps[3] || "" };
  }
  return {
    A: exps.A ?? "",
    B: exps.B ?? "",
    C: exps.C ?? "",
    D: exps.D ?? "",
  };
}

function normalizePayload(p) {
  const ABCD = ["A", "B", "C", "D"];
  const answer_key =
    p.answer_key ??
    (typeof p.correctIndex === "number" ? ABCD[p.correctIndex] : undefined);

  const choices = toChoicesObj(p.choices);
  const choice_images = toChoiceImagesObj(p.choiceImages || p.choice_images);
  const explanations = toExplanationsObj(p.explanations);

  // singular explanation = penjelasan jawaban benar (kalau ada)
  const explanation =
    p.explanation ??
    (answer_key && explanations[answer_key] ? explanations[answer_key] : "");

  const difficulty = p.difficulty
    ? String(p.difficulty).toLowerCase()
    : p.level
    ? String(p.level).toLowerCase()
    : null;

  const tags = Array.isArray(p.tags)
    ? p.tags
    : String(p.tags || "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

  return {
    legacy_id: p.legacy_id || p.id || null,
    question_text: p.question_text || p.question,
    question_image_url: p.question_image_url || p.questionImage || null,
    choices,
    choice_images,
    answer_key,
    explanations,
    explanation,
    difficulty: ["easy", "medium", "hard"].includes(difficulty)
      ? difficulty
      : null,
    source: p.source || null,
    aircraft: p.aircraft || null,
    status: p.status || "draft",
    tags: tags.length ? tags : null,
    // category_ids optional; kalau form kasih category_id(s) taruh di sini
    category_ids: p.category_ids || undefined,
  };
}

async function authed(method, path, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  // kalau kamu pakai proteksi secret di backend, aktifkan header ini:
  if (import.meta.env.VITE_ADMIN_API_SECRET) {
    headers["x-admin-secret"] = import.meta.env.VITE_ADMIN_API_SECRET;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

/* ---------- hook list ---------- */
export function useQuestions({ status, q, category_id } = {}) {
  const [items, setItems] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetcher = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (q) qs.set("q", q);
      if (category_id) qs.set("category_id", category_id);
      const data = await apiFetch(`/questions?${qs.toString()}`);
      setItems(data.items || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [status, q, category_id]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  return { items, isLoading, error, mutate: fetcher };
}

/* ---------- CRUD ---------- */
export async function createQuestion(payload) {
  const body = normalizePayload(payload);
  return authed("POST", "/.netlify/functions/questions", body);
}

export async function updateQuestion(id, payload) {
  const body = normalizePayload(payload);
  body.id = id;
  return authed("PUT", "/.netlify/functions/questions", body);
}

export async function deleteQuestion(id) {
  return authed("DELETE", `/.netlify/functions/questions?id=${encodeURIComponent(id)}`);
}
