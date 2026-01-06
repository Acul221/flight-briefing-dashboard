// src/components/admin/QuestionEditor.jsx
import React from "react";

// Legacy admin editor removed for Quiz V3.
export default function QuestionEditor() {
  return (
    <div className="p-4 border rounded bg-white shadow-sm">
      <p className="text-sm text-gray-700">
        The legacy question editor has been disabled. Use the Notion importer or the
        submit-question Netlify function to create or edit questions in Quiz V3.
      </p>
    </div>
  );
}
