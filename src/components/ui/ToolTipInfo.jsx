import { Info } from "lucide-react";

export default function ToolTipInfo({ text }) {
  return (
    <span className="ml-1 relative group cursor-pointer text-gray-500">
      <Info className="w-4 h-4" />
      <span className="absolute hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded z-10 top-6 left-0 whitespace-nowrap">
        {text}
      </span>
    </span>
  );
}
