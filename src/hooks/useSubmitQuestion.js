// src/hooks/useSubmitQuestion.js
import { useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // <- named export

function toApiPayload(form, selectedCategoryIds) {
  const choices = [form.choiceA, form.choiceB, form.choiceC, form.choiceD].map((v) => v ?? "");
  const explanations = [form.explA ?? "", form.explB ?? "", form.explC ?? "", form.explD ?? ""];

  const tags = Array.isArray(form.tags)
    ? form.tags
    : String(form.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  const aircraft = Array.isArray(form.aircraft)
    ? form.aircraft
    : String(form.aircraft || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  const choiceImageUrls = [
    form.choiceImgA || null,
    form.choiceImgB || null,
    form.choiceImgC || null,
    form.choiceImgD || null,
  ];

  return {
    legacyId: form.legacy_id || undefined,
    question: form.question || "",
    choices,
    correctIndex: Number(form.correctIndex ?? 0),
    explanations,
    difficulty: form.difficulty || "easy",
    status: form.status || "draft",
    tags,
    aircraft,
    questionImageUrl: form.questionImageUrl || null,
    choiceImageUrls,
    category_ids: Array.isArray(selectedCategoryIds) ? selectedCategoryIds : [],
    // Atau pakai path string:
    // category_path: form.categoryPath || undefined,
  };
}

export default function useSubmitQuestion() {
  const call = useCallback(async (form, selectedCategoryIds, { dry = false, mirror = true } = {}) => {
    const { data: sess, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw new Error(`auth_error: ${sessErr.message}`);
    const token = sess?.session?.access_token;
    if (!token) throw new Error("not_signed_in");

    const qs = new URLSearchParams();
    if (dry) qs.set("dry", "1");
    if (!mirror) qs.set("mirror", "0");
    const url = `/.netlify/functions/submit-question${qs.toString() ? `?${qs}` : ""}`;

    const body = toApiPayload(form, selectedCategoryIds);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const issues = Array.isArray(json?.issues) ? `: ${json.issues.join(", ")}` : "";
      throw new Error(`${json?.error || "submit_failed"}${issues}`);
    }
    return json;
  }, []);

  return { call };
}
