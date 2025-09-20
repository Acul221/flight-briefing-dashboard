import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function normalizeTree(json) {
  const data = Array.isArray(json?.tree)
    ? json.tree
    : Array.isArray(json?.items)
    ? json.items
    : Array.isArray(json)
    ? json
    : [];
  // pastikan setiap node ada children array
  const fill = (n) => ({ ...n, children: Array.isArray(n.children) ? n.children.map(fill) : [] });
  return data.map(fill);
}

export default function QuizSelector() {
  const navigate = useNavigate();

  // data
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // ui state
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");

  // selection & controls
  const [selected, setSelected] = useState(null); // {slug,label,isParent,requires_aircraft}
  const [includeDesc, setIncludeDesc] = useState(true);
  const [difficulty, setDifficulty] = useState("easy");
  const [limit, setLimit] = useState(20);
  const [aircraft, setAircraft] = useState("");

  // load last selection
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("quiz.select") || "{}");
      if (saved?.category_slug) {
        setSelected({
          slug: saved.category_slug,
          label: saved.label,
          isParent: !!saved.isParent,
          requires_aircraft: !!saved.requires_aircraft,
        });
        if (typeof saved.include_descendants === "boolean") setIncludeDesc(saved.include_descendants);
        if (saved.difficulty) setDifficulty(saved.difficulty);
        if (saved.limit) setLimit(saved.limit);
        if (saved.aircraft) setAircraft(saved.aircraft);
      }
    } catch {}
  }, []);

  // fetch categories
  useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/.netlify/functions/categories?tree=1");
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        const t = normalizeTree(json);
        if (on) setTree(t);
      } catch (e) {
        console.error("[QuizSelector] load categories:", e);
        if (on) setErr(e.message || String(e));
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  const filteredTree = useMemo(() => {
    if (!search.trim()) return tree;
    const q = search.toLowerCase();
    const filterNode = (n) => {
      const self = n.label?.toLowerCase().includes(q);
      const kids = n.children?.map(filterNode).filter(Boolean) || [];
      return self || kids.length ? { ...n, children: kids } : null;
    };
    return tree.map(filterNode).filter(Boolean);
  }, [tree, search]);

  const requiresAircraft = !!selected?.requires_aircraft;

  function pickParent(node) {
    setSelected({
      slug: node.slug,
      label: node.label,
      isParent: true,
      requires_aircraft: !!node.requires_aircraft,
    });
  }
  function pickChild(node) {
    setSelected({
      slug: node.slug,
      label: node.label,
      isParent: false,
      requires_aircraft: !!node.requires_aircraft,
    });
  }

  function startQuiz() {
    if (!selected?.slug) return;
    if (requiresAircraft && !aircraft.trim()) {
      alert("Kategori ini membutuhkan Aircraft (mis. A320).");
      return;
    }
    const nLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const qp = new URLSearchParams();
    qp.set("category", selected.slug);
    if (selected.isParent && includeDesc) qp.set("desc", "1");
    if (difficulty) qp.set("d", difficulty);
    qp.set("n", String(nLimit));
    if (aircraft.trim()) qp.set("ac", aircraft.trim());

    // cache pilihan
    localStorage.setItem(
      "quiz.select",
      JSON.stringify({
        category_slug: selected.slug,
        label: selected.label,
        isParent: !!selected.isParent,
        requires_aircraft: !!selected.requires_aircraft,
        include_descendants: !!includeDesc,
        difficulty,
        limit: nLimit,
        aircraft: aircraft.trim(),
      })
    );

    navigate(`/quiz?${qp.toString()}`);
  }

  if (loading) return <div className="p-4">Loading categories…</div>;
  if (err) return <div className="p-4 text-red-600">Failed to load categories: {String(err)}</div>;

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-xl font-semibold mb-1">Pilih Kategori</h1>

      {/* search + refresh */}
      <div className="flex items-center gap-2">
        <input
          className="input input-bordered w-full"
          placeholder="Cari kategori atau subkategori…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            // simple refetch
            setLoading(true);
            setErr(null);
            fetch("/.netlify/functions/categories?tree=1")
              .then((r) => r.json())
              .then((j) => setTree(normalizeTree(j)))
              .catch((e) => setErr(e.message || String(e)))
              .finally(() => setLoading(false));
          }}
        >
          Refresh
        </button>
      </div>

      {/* list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredTree.map((cat) => (
          <div
            key={cat.id}
            className={`rounded-lg border p-3 ${selected?.slug === cat.slug ? "ring-1 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold flex items-center gap-2">
                {cat.label}
                {!!cat.pro_only && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-yellow-100">PRO</span>
                )}
                {!!cat.requires_aircraft && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100">ACFT</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-outline btn-xs"
                  onClick={() => pickParent(cat)}
                >
                  Pilih Parent
                </button>
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => setExpanded((m) => ({ ...m, [cat.id]: !m[cat.id] }))}
                >
                  {expanded[cat.id] ? "Sembunyikan" : "Lihat Sub"}
                </button>
              </div>
            </div>

            {expanded[cat.id] && (
              <ul className="ml-4 mt-2 list-disc space-y-1">
                {cat.children?.length ? (
                  cat.children.map((sub) => (
                    <li key={sub.id}>
                      <button
                        className={`underline hover:no-underline ${
                          selected?.slug === sub.slug ? "text-primary font-medium" : ""
                        }`}
                        onClick={() => pickChild(sub)}
                      >
                        {sub.label}
                        {!!sub.requires_aircraft && (
                          <span className="ml-2 text-[11px] px-1 rounded bg-blue-100">ACFT</span>
                        )}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="opacity-60">Tidak ada subkategori.</li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* controls */}
      <div className="rounded-lg border p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <div className="label"><span className="label-text text-sm">Include subcategories</span></div>
            <label className="label cursor-pointer gap-2 px-0">
              <input
                type="checkbox"
                className="toggle toggle-sm"
                checked={includeDesc}
                onChange={() => setIncludeDesc((v) => !v)}
                disabled={!selected?.isParent}
              />
              <span className="label-text text-xs">
                Berlaku jika memilih parent
              </span>
            </label>
          </div>

          <div>
            <div className="label"><span className="label-text text-sm">Difficulty</span></div>
            <div className="join w-full">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`btn join-item w-1/3 ${difficulty === d ? "btn-primary" : "btn-ghost"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label"><span className="label-text text-sm">Limit</span></div>
            <input
              type="number"
              min={1}
              max={100}
              className="input input-bordered w-full"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>

          <div>
            <div className="label"><span className="label-text text-sm">Aircraft</span></div>
            <input
              className={`input input-bordered w-full ${
                requiresAircraft && !aircraft ? "input-error" : ""
              }`}
              value={aircraft}
              onChange={(e) => setAircraft(e.target.value)}
              placeholder="A320,A330"
            />
            {requiresAircraft && !aircraft && (
              <div className="text-[11px] text-error mt-1">Wajib untuk kategori ini</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs opacity-70">
            {selected?.label ? `Dipilih: ${selected.label}` : "Belum memilih kategori"}
          </div>
          <button
            className="btn btn-primary"
            disabled={!selected?.slug}
            onClick={startQuiz}
          >
            Start Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
