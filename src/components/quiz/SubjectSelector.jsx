import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, Plane, Crown, RefreshCcw } from "lucide-react";
import { useCategoriesTree } from "@/hooks/useCategories";

function normalizeTree(json) {
  const data = Array.isArray(json?.tree) ? json.tree : Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : [];
  const fill = (n) => ({ ...n, children: Array.isArray(n.children) ? n.children.map(fill) : [] });
  return data.map(fill);
}

export default function SubjectSelector({
  defaultDifficulty = "easy",
  defaultLimit = 20,
  defaultIncludeDesc = true,
  defaultAircraft = "",
  onStart, // optional: (params) => void
}) {
  const navigate = useNavigate();
  const { tree, flat, loading, error, refetch } = useCategoriesTree();

  // UX state
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState(defaultDifficulty);
  const [limit, setLimit] = useState(defaultLimit);
  const [aircraft, setAircraft] = useState(defaultAircraft);
  const [includeDesc, setIncludeDesc] = useState(defaultIncludeDesc);

  useEffect(() => {
    // restore last selection
    try {
      const saved = JSON.parse(localStorage.getItem("quiz.select") || "{}");
      if (saved?.difficulty) setDifficulty(saved.difficulty);
      if (saved?.limit) setLimit(saved.limit);
      if (saved?.aircraft) setAircraft(saved.aircraft);
      if (typeof saved.include_descendants === "boolean") setIncludeDesc(saved.include_descendants);
    } catch {}
  }, []);

  const filteredParents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const parents = tree || [];
    if (!q) return parents;
    const filterNode = (n) => {
      const self = n.label?.toLowerCase().includes(q);
      const kids = (n.children || []).map(filterNode).filter(Boolean);
      return self || kids.length ? { ...n, children: kids } : null;
    };
    return parents.map(filterNode).filter(Boolean);
  }, [tree, search]);

  const startWith = (slug, label, requiresAircraft, isParent) => {
    if (requiresAircraft && !aircraft.trim()) {
      alert("This category requires an aircraft (e.g., A320).");
      return;
    }
    const nLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const qp = new URLSearchParams();
    qp.set("category", slug);
    if (isParent && includeDesc) qp.set("desc", "1");
    if (difficulty) qp.set("level", difficulty);
    qp.set("n", String(nLimit));
    if (aircraft.trim()) qp.set("ac", aircraft.trim());

    const params = {
      category_slug: slug, label, isParent, requires_aircraft: !!requiresAircraft,
      include_descendants: !!(isParent && includeDesc),
      difficulty, limit: nLimit, aircraft: aircraft.trim(),
    };
    localStorage.setItem("quiz.select", JSON.stringify(params));
    if (onStart) onStart(params);
    navigate(`/quiz?${qp.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-col md:flex-row gap-2 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" size={16} />
          <input
            className="input input-bordered w-full pl-9"
            placeholder="Search subject or subcategory…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="join">
          {["easy", "medium", "hard"].map((d) => (
            <button
              key={d}
              type="button"
              className={`btn join-item ${difficulty === d ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setDifficulty(d)}
              title="Difficulty"
            >
              {d}
            </button>
          ))}
        </div>

        <input
          type="number"
          min={1}
          max={100}
          className="input input-bordered w-24"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          title="Questions"
        />

        <input
          className="input input-bordered w-40"
          placeholder="Aircraft (optional)"
          value={aircraft}
          onChange={(e) => setAircraft(e.target.value)}
          title="Aircraft filter"
        />

        <label className="label cursor-pointer gap-2 mx-1">
          <input
            type="checkbox"
            className="toggle toggle-sm"
            checked={includeDesc}
            onChange={() => setIncludeDesc((v) => !v)}
          />
          <span className="label-text text-xs">Include subcategories</span>
        </label>

        <button className="btn btn-ghost" onClick={refetch} title="Refresh categories">
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* Data states */}
      {loading && <div className="skeleton h-24 w-full" />}
      {error && (
        <div className="alert alert-error">
          <span className="text-sm">Failed to load categories: {error.message}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Daily Scenario Teaser (optional lightweight) */}
          <DailyScenarioTeaser onStart={(slug, label) => startWith(slug, label, false, false)} />

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredParents.map((p, idx) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="rounded-2xl border bg-base-100 shadow-card"
              >
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{p.label}</h3>
                    <div className="flex items-center gap-2">
                      {p.pro_only && (
                        <span className="badge badge-accent inline-flex items-center gap-1">
                          <Crown size={12} /> PRO
                        </span>
                      )}
                      {p.requires_aircraft && (
                        <span className="badge badge-info inline-flex items-center gap-1">
                          <Plane size={12} /> ACFT
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">
                    Start {p.label} questions. Choose difficulty & jump right in.
                  </p>
                </div>

                {/* subcategories list (compact chips) */}
                <div className="p-3 flex flex-wrap gap-2">
                  {(p.children || []).slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="badge badge-ghost hover:badge-secondary"
                      onClick={() => startWith(c.slug, c.label, c.requires_aircraft, false)}
                      title="Start subcategory"
                    >
                      {c.label}
                    </button>
                  ))}
                  {!p.children?.length && (
                    <span className="text-[11px] opacity-60">No subcategories.</span>
                  )}
                </div>

                <div className="p-3 border-t flex items-center justify-end">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => startWith(p.slug, p.label, p.requires_aircraft, true)}
                  >
                    Start
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DailyScenarioTeaser({ onStart }) {
  // super-light teaser pool; you can swap to API later
  const pool = [
    { slug: "atpl-human-factors", label: "Human Factors", line: "Windshear reported on final for RWY 27 — what’s your safest action?" },
    { slug: "atpl-meteorology", label: "Meteorology", line: "You pick up moderate icing at FL180; which checklist item is critical next?" },
    { slug: "atpl-nav", label: "Navigation", line: "RAIM prediction shows outage enroute; what should you plan?" },
  ];
  const pick = pool[Math.floor((Date.now() / 60000) % pool.length)]; // rotate hourly

  return (
    <div className="rounded-2xl border bg-base-100 p-4">
      <div className="text-xs uppercase tracking-wide text-secondary mb-1">Daily Scenario</div>
      <div className="font-medium">{pick.line}</div>
      <div className="mt-2">
        <button
          className="btn btn-accent btn-sm"
          onClick={() => onStart?.(pick.slug, pick.label)}
        >
          Try 3 quick questions
        </button>
      </div>
    </div>
  );
}
