// src/pages/admin/QuestionsHub.jsx
import React, { useCallback, useMemo, useState } from "react";
import QuestionsListPanel from "@/components/admin/QuestionsListPanel";
import QuestionEditorPanel from "@/components/admin/QuestionEditorPanel";
import QuestionEditor from "@/components/admin/QuestionEditor";

export default function QuestionsHub() {
  const [selectedId, setSelectedId] = useState(null);   // null = create baru
  const [filters, setFilters] = useState({
    q: "",
    status: "published",
    categorySlug: "",
    includeDesc: true,
    limit: 20,
    page: 1,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const onRowSelect = useCallback((id) => setSelectedId(id), []);
  const onNew = useCallback(() => setSelectedId(null), []);
  const onSaved = useCallback(() => {
    // setelah save, refresh list & tetap di editor item itu
    setRefreshKey((n) => n + 1);
  }, []);

  const listProps = useMemo(() => ({
    ...filters,
    setFilters,
    refreshKey,
  }), [filters, refreshKey]);

  return (
    <div className="space-y-6">
      <div className="border rounded bg-white shadow-sm">
        <div className="p-3 border-b flex items-center justify-between">
          <div>
            <div className="font-semibold">Quick Create (beta)</div>
            <div className="text-xs text-slate-500">Reuses QuestionCard for live preview; blocks publish on validation.</div>
          </div>
          <span className="text-[11px] text-slate-500">Admin / Questions</span>
        </div>
        <QuestionEditor />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-4">
        {/* LEFT: LIST PANEL */}
        <div className="border rounded bg-white">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="font-semibold">Questions</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
                onClick={() => setRefreshKey((n) => n + 1)}
                title="Refresh list"
              >
                Refresh
              </button>
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={onNew}
                title="Create new question"
              >
                New
              </button>
            </div>
          </div>

          <QuestionsListPanel
            {...listProps}
            onSelect={onRowSelect}
          />
        </div>

        {/* RIGHT: EDITOR PANEL */}
        <div className="border rounded bg-white xl:sticky xl:top-4 h-fit">
          <QuestionEditorPanel
            questionId={selectedId}   // null => create
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>
  );
}
