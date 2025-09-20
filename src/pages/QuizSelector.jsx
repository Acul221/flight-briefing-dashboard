// src/pages/QuizSelector.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Search, ChevronRight, Lock, Plane, RefreshCcw, Sparkles, Info } from "lucide-react";
import QuizSidebar from "@/components/quiz/QuizSidebar";

/** API kecil */
const api = {
  async getTree() {
    const res = await fetch("/.netlify/functions/categories-tree");
    if (!res.ok) throw new Error("Failed to load categories");
    const json = await res.json();
    return json.items || [];
  },
};

export default function QuizSelector() {
  const nav = useNavigate();
  // param `:aircraft` kita treat sbg parentSlug (biar backward-compatible dg route lama)
  const { aircraft: urlParentSlug } = useParams();

  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [includeDesc, setIncludeDesc] = useState(true);
  const [difficulty, setDifficulty] = useState("medium");
  const [limit, setLimit] = useState(20);
  const [aircraft, setAircraft] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try { const items = await api.getTree(); if (mounted) setTree(items); }
      finally { if (mounted) setLoading(false); }
    })();
    return () => (mounted = false);
  }, []);

  const parents = useMemo(
    () => [...tree].sort(
      (a, b) =>
        (a.order_index ?? 0) - (b.order_index ?? 0) ||
        a.label.localeCompare(b.label)
    ),
    [tree]
  );

  const activeParent = parents.find(p => p.slug === urlParentSlug) || parents[0] || null;

  const childrenFiltered = useMemo(() => {
    const list = activeParent?.children || [];
    const s = q.trim().toLowerCase();
    const filtered = s
      ? list.filter(c => c.label.toLowerCase().includes(s) || c.slug.toLowerCase().includes(s))
      : list;
    return [...filtered].sort(
      (a, b) =>
        (a.order_index ?? 0) - (b.order_index ?? 0) ||
        a.label.localeCompare(b.label)
    );
  }, [activeParent, q]);

  const startRandomParent = () => {
    if (!activeParent) return;
    if ((activeParent.requires_aircraft) && !aircraft.trim()) {
      alert("Kategori ini membutuhkan aircraft. Isi field Aircraft lebih dulu.");
      return;
    }
    const query = new URLSearchParams();
    query.set("level", difficulty);
    query.set("limit", String(limit));
    if (includeDesc) query.set("desc", "1");
    if (aircraft) query.set("aircraft", aircraft);
    nav(`/quiz/${encodeURIComponent(activeParent.slug)}?${query.toString()}`);
  };

  const startChild = (child) => {
    if (!activeParent || !child) return;
    const mustAcft = activeParent.requires_aircraft || child.requires_aircraft;
    if (mustAcft && !aircraft.trim()) {
      alert("Kategori ini membutuhkan aircraft. Isi field Aircraft lebih dulu.");
      return;
    }
    const query = new URLSearchParams();
    query.set("level", difficulty);
    query.set("limit", String(limit));
    if (includeDesc) query.set("desc", "1");
    if (aircraft) query.set("aircraft", aircraft);
    nav(`/quiz/${encodeURIComponent(activeParent.slug)}/${encodeURIComponent(child.slug)}?${query.toString()}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar (gambar #4) */}
      <QuizSidebar parents={parents} activeSlug={activeParent?.slug} />

      {/* Main */}
      <section className="flex-1">
        <HeaderBar parent={activeParent} onStartRandom={startRandomParent} loading={loading} />

        <div className="px-4 md:px-8 pb-10">
          {/* Controls */}
          <div className="rounded-2xl border bg-base-100 p-3 md:p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    className="input input-bordered w-full pl-9"
                    placeholder="Cari subkategori…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60">Difficulty</span>
                <div className="join">
                  {["easy", "medium", "hard"].map(d => (
                    <button
                      key={d}
                      className={`btn btn-xs md:btn-sm join-item ${difficulty===d?"btn-primary":"btn-ghost"}`}
                      onClick={()=>setDifficulty(d)}
                    >{d}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs opacity-60">Limit</span>
                <input
                  type="number" min={5} max={100}
                  className="input input-bordered input-xs md:input-sm w-24"
                  value={limit}
                  onChange={(e)=>setLimit(parseInt(e.target.value||"20",10))}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="form-control">
                  <label className="label cursor-pointer gap-2">
                    <input type="checkbox" className="toggle toggle-sm"
                      checked={includeDesc} onChange={()=>setIncludeDesc(v=>!v)} />
                    <span className="label-text text-xs">Include subcategories</span>
                    <span className="tooltip" data-tip="Berlaku jika memilih parent">
                      <Info size={14} className="opacity-50" />
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <input
                  className="input input-bordered w-full"
                  placeholder="Aircraft (contoh: A320, B737) — wajib untuk kategori tertentu"
                  value={aircraft}
                  onChange={(e)=>setAircraft(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={()=>window.location.reload()}>
                  <RefreshCcw size={14}/> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Grid subcategory cards */}
          {loading ? <SkeletonGrid/> :
            !activeParent ? <EmptyState/> :
            <CardsGrid parent={activeParent} childrenList={childrenFiltered} onStartChild={startChild} />
          }
        </div>
      </section>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function HeaderBar({ parent, onStartRandom, loading }) {
  return (
    <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur border-b">
      <div className="px-4 md:px-8 py-3 flex items-center justify-between">
        <div>
          <div className="text-xs opacity-60">SkyDeckPro • Quiz</div>
          <h1 className="text-lg md:text-2xl font-bold tracking-tight">
            {parent ? parent.label : "Loading…"}
          </h1>
          {parent?.pro_only ? <span className="badge badge-warning badge-sm mt-1">PRO</span> : null}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={onStartRandom} disabled={!parent || loading}>
            <Sparkles size={16}/> Start random {parent ? parent.label : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function CardsGrid({ parent, childrenList, onStartChild }) {
  if (!childrenList.length) {
    return <div className="rounded-2xl border p-10 text-center text-sm opacity-70">Tidak ada subkategori pada parent ini.</div>;
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {childrenList.map(c => (
        <CategoryCard key={c.id} parent={parent} cat={c} onStart={()=>onStartChild(c)} />
      ))}
    </div>
  );
}

function CategoryCard({ parent, cat, onStart }) {
  const mustAircraft = parent.requires_aircraft || cat.requires_aircraft;
  return (
    <div className="card bg-base-100 border hover:shadow-xl transition-shadow rounded-2xl">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <h3 className="card-title text-base">{cat.label}</h3>
          <div className="flex gap-1">
            {cat.pro_only ? <span className="badge badge-warning">PRO</span> : null}
            {mustAircraft ? (
              <span className="tooltip" data-tip="Requires aircraft">
                <Plane size={16} className="text-info" />
              </span>
            ) : null}
          </div>
        </div>
        <p className="text-xs opacity-70">100+ questions • Detailed explanations • Shuffle enabled</p>
        <div className="card-actions justify-end mt-3">
          <button className="btn btn-ghost btn-sm">
            <Link
              to={`/quiz/${encodeURIComponent(parent.slug)}/${encodeURIComponent(cat.slug)}`}
              className="inline-flex items-center gap-1"
              onClick={(e)=>e.preventDefault()}
            >
              Learn more <ChevronRight size={14}/>
            </Link>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onStart}>Practice</button>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4">
          <div className="skeleton h-5 w-40 mb-3" />
          <div className="skeleton h-4 w-56 mb-2" />
          <div className="skeleton h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return <div className="rounded-2xl border p-10 text-center text-sm opacity-70">Tidak ada kategori.</div>;
}
