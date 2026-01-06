// src/layouts/QuizShell.jsx
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import CategorySidebar from "@/components/quiz/CategorySidebar";
import BackToDashboardButton from "@/components/ui/BackToDashboardButton";

const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_BASE || "/.netlify/functions").replace(/\/+$/, "");

export default function QuizShell() {
  const { aircraft } = useParams(); // slug aktif kalau sedang di /quiz/:aircraft/...
  const [parents, setParents] = useState([]);      // root categories (aircraft/ATPL/etc.)
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Categories endpoint removed; sidebar will render empty list.
    setParents([]);
    setErr("");
    setLoading(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F8F9FB] text-[#2E3A45]">
      {/* Sidebar kiri */}
      <CategorySidebar
        categories={parents}
        activeSlug={aircraft || null}
        loading={loading}
      />

      {/* Area konten */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        {err && (
          <div className="mb-3 p-2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-sm">
            {err}
          </div>
        )}
        <div className="mb-4">
          <BackToDashboardButton />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
