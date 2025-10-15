import { useEffect, useState } from "react";
import PropTypes from "prop-types";

export default function CategoryTreeViewer({ apiUrl = "/.netlify/functions/categories?root_only=0" }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTree() {
      try {
        setLoading(true);
        const res = await fetch(apiUrl, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        // expected shape: { items: [ { id, label, slug, parent_id } ] }
        const list = json.items || [];
        setCategories(buildTree(list));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadTree();
  }, [apiUrl]);

  if (loading)
    return <div className="p-4 text-slate-500 animate-pulse">Loading category tree...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-lg">
        Failed to load: {error}
      </div>
    );

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-slate-800 font-semibold mb-3">📂 Category Tree</h2>
      <CategoryList nodes={categories} />
    </div>
  );
}

/* Recursive renderer */
function CategoryList({ nodes, level = 0 }) {
  return (
    <ul className={level === 0 ? "space-y-1" : "ml-5 space-y-1"}>
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${
                level === 0 ? "font-bold text-slate-900" : "text-slate-700"
              }`}
            >
              {node.label}
            </span>
            <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{node.slug}</code>
          </div>
          {node.children?.length > 0 && <CategoryList nodes={node.children} level={level + 1} />}
        </li>
      ))}
    </ul>
  );
}

/* Helper: build tree structure from flat array */
function buildTree(list) {
  const map = new Map();
  const roots = [];

  list.forEach((item) => map.set(item.id, { ...item, children: [] }));

  list.forEach((item) => {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(map.get(item.id));
    } else {
      roots.push(map.get(item.id));
    }
  });

  return roots;
}

CategoryTreeViewer.propTypes = {
  apiUrl: PropTypes.string,
};
