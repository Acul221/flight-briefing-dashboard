import { useState } from "react";

export default function ReasoningBox({ text }) {
  const [visible, setVisible] = useState(true);

  if (!text) return null;

  return (
    <div className="mt-4 p-4 bg-white/40 dark:bg-gray-800/50 rounded shadow border">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
          🧠 AI Reasoning
        </h4>
        <button
          onClick={() => setVisible(!visible)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {visible ? "▾ Hide" : "▸ Show"}
        </button>
      </div>

      {visible && (
        <pre className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">
          {text}
        </pre>
      )}
    </div>
  );
}
