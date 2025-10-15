// src/pages/quiz/OverviewPage.jsx
import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";

export default function OverviewPage() {
  const { profile, loading } = useProfile();
  const name = useMemo(() => {
    if (!profile) return null;
    return profile.full_name || profile.email || "Pilot";
  }, [profile]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to SkyDeckPro Quiz Center</h1>
        <p className="text-slate-600 mt-1">
          {loading
            ? "Loading your profile..."
            : name
            ? `Hello, ${name}.`
            : "Welcome, Guest Pilot"}
        </p>
        <div className="bg-[#EAF4F6] border border-[#E0E0E0] rounded-xl p-4 mt-4 text-[#607D8B]">
          You’ve completed 12 quizzes. Keep your consistency (SLOWSITENCY).
        </div>
      </div>

      {/* Mock progress summary */}
      <div className="bg-[#E3F2FD] border border-[#90CAF9] rounded-xl p-4">
        <p className="text-slate-800">
          Pick a category from the left to get started. You’ll find curated subjects and tailored practice sets.
        </p>
      </div>
    </div>
  );
}
