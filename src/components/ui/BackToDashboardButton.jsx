// src/components/ui/BackToDashboardButton.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackToDashboardButton() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/")}
      className="inline-flex items-center gap-2 text-[#0D47A1] hover:text-[#2196F3] transition-colors text-sm"
      aria-label="Back to Dashboard"
    >
      <ArrowLeft size={16} />
      <span>Back to Dashboard</span>
    </button>
  );
}

