// src/pages/QuizSelector.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ChevronRight, RefreshCcw, Search, Zap, Layers, Gauge,
  Plane, FolderOpen, Sparkles, Shield, Filter
} from "lucide-react";

/* ---- helpers ------------------------------------------------------------ */

function cls(...xs) { return xs.filter(Boolean).join(" "); }
function titleCase(s) { return String(s || "").replace(/[-_]/g, " ").replace(/\s+/g, " ").trim(); }
function toAcftCode(slug) { return String(slug || "").toUpperCase(); }

/** cari node di tree by slug */
function findNodeBySlug(tree, slug) {
  if (!Array.isArray(tree)) return null;
  for (const n of tree) {
    if (n.slug === slug) return n;
    const c = findNodeBySlug(n.children || [], slug);
    if (c) return c;
  }
  return null;
}

/** kumpulkan kategori yg requires_aircraft=true dari seluruh tree (maks 8) */
function collectRequires(tree) {
  const out = [];
  (function walk(nodes) {
    for (const n of nodes || []) {
      if (n.requires_aircraft) out.push(n);
      if (out.length >= 8) return;
      walk(n.children || []);
    }
  })(tree || []);
  return out;
}

/** fetcher sederhana */
async function fetchCategoryTree() {
  const r = await fetch("/.netlify/functions/categories-tree");
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
  return j.items || [];
}

/* ---- UI atoms ----------------------------------------------------------- */

function Badge({ children, tone = "ghost" }) {
  return <span className={cls("badge", tone === "ghost" ? "badge-ghost" : "")}>{children}</span>;
}

function Segmented({ value, onChange, items }) {
  return (
    <div className="join">
      {items.map(it => (
        <button
          key={it.value}
          type="button"
          className={cls("btn btn-xs md:btn-sm join-item", value === it.value ? "btn-primary" : "btn-ghost")}
          onClick={() => onChange(it.value)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Card({ title, subtitle, footer, onClick, proOnly, requiresAircraft }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border bg-white hover:shadow-md transition p-4 flex flex-col"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-violet-50 grid place-items-center group-hover:scale-105 transition">
            <Gauge size={18} />
          </div>
          <div>
            <div className="font-medium">{title}</div>
            {subtitle && <div className="text-xs opacity-60 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        <ChevronRight className="opacity-40 group-hover:opacity-80" size={18} />
      </div>
      <div className="mt-3 flex gap-2 flex-wrap">
        {proOnly && <Badge tone="ghost">PRO</Badge>}
        {requiresAircraft && <Badge tone="ghost">ACFT</Badge>}
        <Badge tone="ghost">Shuffle</Badge>
        <Badge tone="ghost">Explanation</Badge>
      </div>
      {footer && <div className="mt-3 text-xs opacity-60">{footer}</div>}
    </div>
  );
}

function Sidebar({ roots, currentSlug }) {
  const ICONS = {
    overview: <FolderOpen size={16} />,
    a320: <Plane size={16} />,
    "aircraft-systems": <Layers size={16} />,
    systems: <Layers size={16} />,
    procedure: <Shield size={16} />,
    default: <Sparkles size={16} />,
  };
  return (
    <aside className="w-56 shrink-0 border-r bg-base-100">
      <div className="p-3 text-xs font-semibold opacity-70">QUIZ MENU</div>
      <nav className="flex flex-col">
        {roots.map(r => (
          <Link
            key={r.id}
            to={`/quiz/${r.slug}`}
            className={cls(
              "px-3 py-2 flex items-center gap-2 hover:bg-base-200",
              currentSlug === r.slug ? "bg-base-200 font-medium" : ""
            )}
          >
            {(ICONS[r.slug] || ICONS.default)}
            <span className="truncate">{r.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

/* ---- main page ---------------------------------------------------------- */

export default function QuizSelector() {
  const { aircraft: currentSlug } = useParams();
  const navigate = useNavigate();

  // filters
  const [level, setLevel] = useState("medium");
  const [limit, setLimit] = useState(20);
  const [includeDesc, setIncludeDesc] = useState(true);
  const [q, setQ] = useState("");
  const [acftText, setAcftText] = useState("");

  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [installed, setInstalled] = useState({ roots: [], parent: null, children: [], recommended: [] });

  // load categories
  useEffect(() => {
    let live = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const t = await fetchCategoryTree();
        if (!live) return;
        setTree(t);
      } catch (e) {
        if (!live) return;
        setErr(e.message || "failed");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  // resolve current parent/children/recommended
  useEffect(() => {
    const roots = (tree || []).map(r => ({ id: r.id, slug: r.slug, label: r.label }));
    const parent = findNodeBySlug(tree, currentSlug) || null;
    const children = (parent?.children || []).slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    const recommendedAll = collectRequires(tree);
    // Filter rekomendasi agar tidak menampilkan parent yg sama
    const recommended = recommendedAll
      .filter(x => !parent || x.slug !== parent.slug)
      .slice(0, 8);

    // Aircraft input default dari slug jika sepertinya code pesawat
    const maybeAc = toAcftCode(currentSlug);
    if (/^[A-Z]+\d+$/.test(maybeAc) && !acftText) setAcftText(maybeAc);

    setInstalled({ roots, parent, children, recommended });
  }, [tree, currentSlug]); // eslint-disable-line

  const filteredChildren = useMemo(() => {
    const qx = q.trim().toLowerCase();
    if (!qx) return installed.children;
    return (installed.children || []).filter(c =>
      c.label.toLowerCase().includes(qx) || c.slug.toLowerCase().includes(qx)
    );
  }, [q, installed.children]);

  const goPractice = useCallback((subjectSlug) => {
    let target = subjectSlug;
    if (!target) {
      if (installed.children?.length) target = installed.children[0].slug;
      else if (installed.recommended?.length) target = installed.recommended[0].slug;
      else if (installed.roots?.length) target = installed.roots[0].slug;
      else target = "general";
    }
    const params = new URLSearchParams();
    params.set("level", level);
    params.set("limit", String(limit));
    if (includeDesc) params.set("desc", "1");
    if (acftText.trim()) {
      params.set("ac", acftText.trim());
      params.set("strict_ac", "1");
    }
    navigate(`/quiz/${currentSlug}/${target}?${params.toString()}`);
  }, [installed, currentSlug, level, limit, includeDesc, acftText, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200">
      <div className="max-w-[1200px] mx-auto flex">
        {/* left menu */}
        <Sidebar roots={installed.roots} currentSlug={currentSlug} />

        {/* content */}
        <section className="flex-1 p-4 md:p-6">
          <header className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs opacity-60">SkyDeckPro • Quiz</div>
              <h1 className="text-xl font-semibold">{titleCase(currentSlug)}</h1>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => goPractice(null)}
              disabled={loading}
              title={`Start random ${currentSlug}`}
            >
              <Zap size={16} className="mr-1" />
              Start random {currentSlug}
            </button>
          </header>

          {/* filters */}
          <div className="mt-4 rounded-2xl border bg-white p-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    className="input input-bordered w-full pl-10"
                    placeholder="Cari subkategori…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div className="md:col-span-3 flex items-center gap-2">
                <span className="text-xs opacity-60">Difficulty</span>
                <Segmented
                  value={level}
                  onChange={setLevel}
                  items={[
                    { value: "easy", label: "easy" },
                    { value: "medium", label: "medium" },
                    { value: "hard", label: "hard" },
                  ]}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-xs opacity-60">Limit</span>
                <input
                  type="number"
                  min={5}
                  max={100}
                  className="input input-bordered input-sm w-20"
                  value={limit}
                  onChange={e => setLimit(parseInt(e.target.value || "20", 10))}
                />
              </div>

              <div className="md:col-span-3">
                <input
                  className="input input-bordered input-sm w-full"
                  placeholder="Aircraft (contoh: A320, B737)…"
                  value={acftText}
                  onChange={e => setAcftText(e.target.value)}
                />
              </div>

              <div className="md:col-span-12 flex items-center justify-between">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="checkbox"
                    className="toggle toggle-xs"
                    checked={includeDesc}
                    onChange={e => setIncludeDesc(e.target.checked)}
                  />
                  <span className="text-xs opacity-70">Include subcategories</span>
                </label>
                <button className="btn btn-ghost btn-xs" onClick={() => window.location.reload()}>
                  <RefreshCcw size={14} /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* content grid */}
          <div className="mt-4">
            {err && <div className="alert alert-error">{err}</div>}
            {loading && <div className="p-6 text-sm opacity-60">Loading categories…</div>}

            {!loading && filteredChildren?.length > 0 && (
              <>
                <div className="text-sm font-medium mb-2">Subcategories</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredChildren.map(c => (
                    <Card
                      key={c.id}
                      title={c.label}
                      subtitle="Detailed explanations • Shuffle enabled"
                      footer="Learn more →"
                      proOnly={c.pro_only}
                      requiresAircraft={c.requires_aircraft}
                      onClick={() => goPractice(c.slug)}
                    />
                  ))}
                </div>
              </>
            )}

            {!loading && filteredChildren?.length === 0 && (
              <div className="rounded-2xl border bg-white p-6 text-center text-sm opacity-70">
                Tidak ada subkategori pada parent ini.
              </div>
            )}

            {/* Recommendations when empty (e.g., a320) */}
            {!loading && installed.children?.length === 0 && installed.recommended?.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Filter size={16} className="opacity-60" />
                  <div className="text-sm font-medium">Recommended sets (aircraft-aware)</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {installed.recommended.map(c => (
                    <Card
                      key={c.id}
                      title={c.label}
                      subtitle="Works with aircraft filter"
                      proOnly={c.pro_only}
                      requiresAircraft={c.requires_aircraft}
                      onClick={() => goPractice(c.slug)}
                    />
                  ))}
                </div>
                {!acftText && (
                  <div className="mt-3 text-xs opacity-60">
                    Tips: masukkan kode pesawat (mis. <b>{toAcftCode(currentSlug)}</b>) agar soal difilter ketat ke tipe tersebut.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
