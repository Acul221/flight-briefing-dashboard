// src/components/quiz/ExamAttemptsPanel.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";

export default function ExamAttemptsPanel({ attempts = [] }) {
  const rows = useMemo(() => {
    return attempts.map((a) => {
      const answers = Array.isArray(a.answers) ? a.answers : [];
      const total = answers.length;
      const correct = answers.filter((x) => x.selectedIndex === x.correctIndex).length;
      const scorePct = total ? Math.round((correct / total) * 100) : 0;
      return {
        id: a.id,
        created_at: a.created_at,
        total,
        correct,
        incorrect: total - correct,
        scorePct,
      };
    });
  }, [attempts]);

  if (!rows.length) return <div>No attempts yet.</div>;

  return (
    <ul className="space-y-1">
      {rows.map((r) => (
        <li
          key={r.id || r.created_at}
          className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1"
        >
          <span>{new Date(r.created_at).toLocaleString()}</span>
          <span className="text-slate-500">
            {r.correct}/{r.total} ({r.scorePct}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

ExamAttemptsPanel.propTypes = {
  attempts: PropTypes.array,
};
