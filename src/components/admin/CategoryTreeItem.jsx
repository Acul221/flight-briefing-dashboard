import React from "react";

export default function CategoryTreeItem({ node, onEdit, onDelete, onAddChild, onReorder }) {
  const disabledUp = node._isFirst;
  const disabledDown = node._isLast;

  return (
    <li className="py-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{node.label}</span>
        {node.pro_only && <span className="text-xs px-2 py-0.5 bg-yellow-100 rounded">PRO</span>}
        {node.requires_aircraft && <span className="text-xs px-2 py-0.5 bg-blue-100 rounded">ACFT</span>}
        {!node.is_active && <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">inactive</span>}
        <div className="ml-auto flex items-center gap-1">
          <button className="btn btn-xs" onClick={() => onAddChild(node)}>+ Sub</button>
          <button className="btn btn-xs" onClick={() => onEdit(node)}>Edit</button>
          <button className="btn btn-xs btn-error" onClick={() => onDelete(node.id)}>Del</button>
          <button className="btn btn-xs" disabled={disabledUp} onClick={() => onReorder(node, "up")}>↑</button>
          <button className="btn btn-xs" disabled={disabledDown} onClick={() => onReorder(node, "down")}>↓</button>
        </div>
      </div>

      {node.children?.length > 0 && (
        <ul className="pl-4 border-l mt-1">
          {node.children.map((child, i) => (
            <CategoryTreeItem
              key={child.id}
              node={{ ...child, _isFirst: i === 0, _isLast: i === node.children.length - 1 }}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onReorder={onReorder}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
