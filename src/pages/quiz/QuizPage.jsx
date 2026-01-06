// src/pages/quiz/QuizPage.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useUserTier } from "@/hooks/useUserTier";
import QuizRunner from "@/components/quiz/QuizRunner";

export default function QuizPage() {
  const { categorySlug = "", subjectSlug = "" } = useParams();
  const { tier, setTier } = useUserTier();

  const resolvedCategory = subjectSlug || categorySlug || "";
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [difficulty, setDifficulty] = useState("all");
  const [requiresAircraft, setRequiresAircraft] = useState(false);

  const title = resolvedCategory ? resolvedCategory.replace(/-/g, " ") : "Quiz";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">Quiz — {title}</h1>
          <p className="text-xs text-slate-500">Tier: {tier?.toUpperCase?.() || "FREE"}</p>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Toggle tier (dev):</span>
          <button className="px-2 py-1 border rounded text-xs" onClick={() => setTier("free")}>
            Free
          </button>
          <button className="px-2 py-1 border rounded text-xs" onClick={() => setTier("pro")}>
            Pro
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[320px_1fr]">
        <div className="border rounded-xl bg-white p-4 space-y-4 shadow-sm">
          <div>
            <label className="block text-sm font-semibold mb-1">Difficulty</label>
            <select
              className="w-full border rounded px-3 py-2 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="all">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="requiresAircraft"
              type="checkbox"
              checked={requiresAircraft}
              onChange={(e) => setRequiresAircraft(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <label htmlFor="requiresAircraft" className="text-sm">
              Requires aircraft-specific questions only
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="includeDescendants"
              type="checkbox"
              checked={includeDescendants}
              onChange={(e) => setIncludeDescendants(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <label htmlFor="includeDescendants" className="text-sm">
              Include descendant categories
            </label>
          </div>
        </div>

        <div className="border rounded-xl bg-white p-4 shadow-sm">
          <QuizRunner
            categorySlug={resolvedCategory}
            includeDescendants={includeDescendants}
            difficulty={difficulty}
            requiresAircraft={requiresAircraft}
            userTier={tier}
          />
        </div>
      </div>
    </div>
  );
}
