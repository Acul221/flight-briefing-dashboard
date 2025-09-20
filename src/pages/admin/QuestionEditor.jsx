// src/pages/admin/QuestionEditor.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, RefreshCcw, UploadCloud, Filter, Search, Send, Trash2,
  Clock, CheckCircle2, CircleHelp, Link as LinkIcon, Download, Copy
} from "lucide-react";
import QuestionForm from "@/components/admin/QuestionForm";
import { useCategoriesFlat } from "@/hooks/useCategories";
import { adminFetch } from "@/lib/adminFetch";

/** debounce kecil */
function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

export default function QuestionEditor() {
  const [status, setStatus] = useState("draft");
  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState(50);
  const [q, setQ] = useState("");
  const qDeb = useDebounce(q);

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  const { items: flatCats } = useCategoriesFlat();
  const catOptions = useMemo(() => [{ id: "", label: "(all categories)" }, ...(flatCats || [])], [flatCats]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (qDeb) qs.set("q", qDeb);
      if (categoryId) qs.set("category_id", categoryId);
      if (limit) qs.set("limit", String(limit));
      qs.set("include_categories", "1"); // tampilkan chips kategori
      const data = await adminFetch(`/.netlify/functions/questions?${qs.toString()}`, { method: "GET" });
      setItems(data.items || []);
      setCount(data.count || 0);
    } catch (e) {
      setNote({ type: "err", msg: e.message });
    } finally {
      setLoading(false);
    }
  }, [status, qDeb, categoryId, limit]);

  useEffect(() => { loadList(); }, [loadList]);

  const openItem = async (id) => {
    try {
      const data = await adminFetch(`/.netlify/functions/questions?id=${id}`, { method: "GET" });
      setSelected(data.item);
    } catch (e) {
      setNote({ type: "err", msg: e.message });
    }
  };

  const newQuestionInline = () => setSelected(null);

  const doImportNotion = async () => {
    if (!confirm("Import dari Notion sekarang? (batched 50)")) return;
    setBusy(true);
    try {
      const res = await adminFetch("/.netlify/functions/notion-import?limit=50&dry=0", { method: "POST" });
      setNote({ type: "ok", msg: `Import OK (${res?.inserted ?? "done"})` });
      await loadList();
    } catch (e) { setNote({ type: "err", msg: e.message }); } finally { setBusy(false); }
  };

  const doBulkPublish = async () => {
    if (!confirm("Publish semua hasil filter saat ini?")) return;
    setBusy(true);
    try {
      const body = { action: "bulk_status", status: "published", filters: { q: qDeb || undefined, category_id: categoryId || undefined } };
      const res = await adminFetch("/.netlify/functions/questions", { method: "PATCH", body });
      setNote({ type: "ok", msg: `Published ${res?.updated || 0} item(s)` });
      await loadList();
    } catch (e) { setNote({ type: "err", msg: e.message }); } finally { setBusy(false); }
  };

  const removeQuestion = async (id) => {
    if (!confirm("Hapus soal ini?")) return;
    try {
      await adminFetch(`/.netlify/functions/questions?id=${id}`, { method: "DELETE" });
      if (selected?.id === id) setSelected(null);
      setNote({ type: "ok", msg: "Deleted" });
      await loadList();
    } catch (e) {
      setNote({ type: "err", msg: e.message });
    }
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...selected };
    delete copy.id;
    copy.status = "draft";
    copy.legacy_id = null;
    copy.code = "";
    setSelected(copy);
    setNote({ type: "ok", msg: "Duplicated to new draft" });
  };

  const exportCsv = () => {
    const rows = [
      ["id","status","difficulty","question","answer_key","first_category","tags"].join(",")
    ];
    (items || []).forEach(it => {
      const cat = (it.categories?.[0]?.label || "").replaceAll(",", " ");
      const tags = (it.tags || []).join("|").replaceAll(",", " ");
      rows.push([
        it.id, it.status, it.difficulty || "",
        JSON.stringify(it.question_text || "").slice(1,-1),
        it.answer_key || "",
        cat, tags
      ].join(","));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "questions_filtered.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Question Editor</h1>
            <p className="text-xs opacity-60">{count} item • klik untuk edit di panel kanan.</p>
          </div>

          <div className="hidden md:flex gap-2">
            {/* 👉 New: link ke form dedicated */}
            <Link to="/admin/questions/new" className="btn btn-primary">
              <Plus size={16}/> New Question
            </Link>
            {/* Inline draft baru (opsional) */}
            <button className="btn btn-ghost" onClick={newQuestionInline}><Copy size={16}/> New (inline blank)</button>
            <button className="btn btn-ghost" onClick={duplicateSelected} disabled={!selected}><Copy size={16}/> Duplicate</button>
            <button className="btn btn-ghost" onClick={doImportNotion} disabled={busy}><UploadCloud size={16}/> Import from Notion</button>
            <button className="btn btn-ghost" onClick={doBulkPublish} disabled={busy}><Send size={16}/> Publish all (filtered)</button>
            <button className="btn btn-ghost" onClick={exportCsv} disabled={!items.length}><Download size={16}/> Export CSV</button>
            <button className="btn btn-ghost" onClick={loadList} disabled={loading}><RefreshCcw size={16}/> Refresh</button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 rounded-xl border p-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <div className="flex items-center gap-2">
              <Filter size={16} className="opacity-60"/>
              <div className="join">
                {["draft","published","archived"].map(s=>(
                  <button key={s} type="button"
                    className={`btn btn-xs md:btn-sm join-item ${status===s?"btn-neutral":"btn-ghost"}`}
                    onClick={()=>setStatus(s)}>{s}</button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <select className="select select-bordered w-full" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}>
                {catOptions.map(c=>(
                  <option key={c.id || "all"} value={c.id}>{c.label}{c.parent_id?" (sub)":""}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Search size={16} className="opacity-60"/>
              <input className="input input-bordered w-full" placeholder="Search question text…" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs opacity-60">Show</span>
              <select className="select select-bordered select-xs md:select-sm" value={limit} onChange={(e)=>setLimit(parseInt(e.target.value,10))}>
                {[20,50,100,150,200].map(n=>(<option key={n} value={n}>{n}</option>))}
              </select>
              <button className="btn btn-ghost btn-xs md:btn-sm" onClick={loadList} disabled={loading}><RefreshCcw size={14}/> Refresh</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {note && (
        <div className={`alert ${note.type==="ok"?"alert-success":"alert-error"} mb-4`}>
          {note.type==="ok"?<CheckCircle2 size={18}/>:<CircleHelp size={18}/>}
          <span className="text-sm">{note.msg}</span>
        </div>
      )}

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* List */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-2xl border bg-base-100">
          <div className="p-3 border-b text-sm font-medium">Results</div>
          <div className="h-[60vh] overflow-auto divide-y">
            {loading && <div className="p-3 space-y-2">{[...Array(6)].map((_,i)=>(<div key={i} className="skeleton h-14 w-full" />))}</div>}
            {!loading && !items.length && <div className="p-6 text-center text-sm opacity-60">No questions found.</div>}
            {!loading && items.map(it=>(
              <ItemRow key={it.id} item={it} active={selected?.id===it.id} onOpen={()=>openItem(it.id)} onRemove={()=>removeQuestion(it.id)} />
            ))}
          </div>
        </motion.div>

        {/* Form (inline editor lama) */}
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="rounded-2xl border p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-sm">{selected ? "Edit Question" : "New Question (inline draft)"}</div>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" onClick={newQuestionInline}><Plus size={16}/> New</button>
              <button className="btn btn-ghost btn-sm" onClick={duplicateSelected} disabled={!selected}><Copy size={16}/> Duplicate</button>
            </div>
          </div>
          <QuestionForm initial={selected} onAfterSave={loadList} />
        </motion.div>
      </div>
    </div>
  );
}

function ItemRow({ item, onOpen, onRemove, active }) {
  const chips = (
    <>
      {item.difficulty && <span className="badge badge-ghost gap-1"><Clock size={12}/> {item.difficulty}</span>}
      <span className={`badge gap-1 ${item.status==="published"?"badge-success":"badge-ghost"}`}>
        <CheckCircle2 size={12}/> {item.status}
      </span>
      {(item.categories || []).slice(0,2).map(c=>(
        <span key={c.id} className="badge badge-outline">{c.label}</span>
      ))}
      {item.legacy_id && (
        <a href={`https://www.notion.so/${String(item.legacy_id).replace(/-/g,"")}`} target="_blank" rel="noreferrer" className="badge badge-ghost gap-1">
          <LinkIcon size={12}/> Notion
        </a>
      )}
    </>
  );

  return (
    <div className={`p-3 hover:bg-base-200 cursor-pointer ${active ? "bg-base-200" : ""}`} onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm line-clamp-2">{item.question_text}</div>
          <div className="mt-1 flex flex-wrap gap-1">{chips}</div>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={(e)=>{e.stopPropagation(); onRemove();}}>
          <Trash2 size={14}/>
        </button>
      </div>
    </div>
  );
}
