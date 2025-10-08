// src/pages/admin/QuestionFormPage.jsx
import { useState } from "react";
import toast from "react-hot-toast";
import QuestionFormLayout from "@/components/admin/QuestionFormLayout";
import { buildQuestionPayload } from "@/utils/buildQuestionPayload";
import { adminFetch } from "@/utils/adminFetch";

export default function QuestionFormPage({
  editingQuestion = null,
  onSaved,
  onCancel,
}) {
  const [form, setForm] = useState(
    editingQuestion
      ? {
          id: editingQuestion.legacy_id || editingQuestion.id,
          category: editingQuestion.category_label || "",
          subcategory: editingQuestion.subcategory_label || "",
          question: editingQuestion.question_text || "",
          questionImage: editingQuestion.question_image_url || "",
          answers: [
            editingQuestion.choices?.A || "",
            editingQuestion.choices?.B || "",
            editingQuestion.choices?.C || "",
            editingQuestion.choices?.D || "",
          ],
          explanations: editingQuestion.explanations || ["", "", "", ""],
          correctIndex:
            { A: 0, B: 1, C: 2, D: 3 }[editingQuestion.answer_key] ?? 0,
          choiceImages:
            editingQuestion.choice_images || [null, null, null, null],
          level: editingQuestion.difficulty || "medium",
          source: editingQuestion.source || "",
          tags: (editingQuestion.tags || []).join(", "),
          aircraft: editingQuestion.aircraft || "",
          status: editingQuestion.status || "draft",
        }
      : {
          id: "",
          category: "",
          subcategory: "",
          question: "",
          questionImage: "",
          answers: ["", "", "", ""],
          explanations: ["", "", "", ""],
          correctIndex: 0,
          choiceImages: [null, null, null, null],
          level: "medium",
          source: "",
          tags: "",
          aircraft: "",
          status: "draft",
        }
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      const payload = buildQuestionPayload(form);
      const url = "/.netlify/functions/questions";
      if (editingQuestion?.id) {
        const res = await adminFetch(`${url}?id=${encodeURIComponent(editingQuestion.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || "Failed to update question");
        toast.success("Question updated.");
        if (onSaved) onSaved(json.data || json);
      } else {
        const res = await adminFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || "Failed to create question");
        toast.success("Question created.");
        if (onSaved) onSaved(json.data || json);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingQuestion?.id) return;
    if (!confirm("Delete this question permanently?")) return;
    try {
      setDeleting(true);
      const res = await adminFetch(`/.netlify/functions/questions?id=${editingQuestion.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to delete question");
      }
      toast.success("Question deleted.");
      if (onSaved) onSaved({ deleted: true, id: editingQuestion.id });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete question");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <QuestionFormLayout
        form={form}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onDelete={editingQuestion ? handleDelete : null}
        saving={saving}
        deleting={deleting}
      />
      {onCancel ? (
        <div className="mt-4">
          <button className="btn" onClick={onCancel}>Cancel</button>
        </div>
      ) : null}
    </div>
  );
}
