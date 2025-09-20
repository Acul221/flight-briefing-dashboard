// src/pages/admin/QuestionCreateEdit.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QuestionFormFull from "@/components/admin/QuestionFormFull";
import { adminFetch } from "@/lib/adminFetch";

/**
 * Route:
 * - /admin/questions/new           -> create mode
 * - /admin/questions/:id/edit      -> edit mode (id = questions.id UUID)
 */
export default function QuestionCreateEdit() {
  const { id } = useParams(); // UUID or undefined for "new"
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [initial, setInitial] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isEdit) return;
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/.netlify/functions/questions?id=${encodeURIComponent(id)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setInitial(json?.item || null);
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  function handleAfterSave() {
    // Optional: navigate back to list
    // navigate("/admin/questions");
  }

  return (
    <div className="p-6">
      {loading && <div className="skeleton h-8 w-48 mb-4" />}
      {err && <div className="alert alert-error mb-4"><span>{err.message}</span></div>}

      {!isEdit && <QuestionFormFull initial={null} onAfterSave={handleAfterSave} />}
      {isEdit && initial && <QuestionFormFull initial={initial} onAfterSave={handleAfterSave} />}
    </div>
  );
}
