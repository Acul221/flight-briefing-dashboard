// src/routes/ProtectedRoute.jsx
import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

/**
 * ProtectedRoute
 * - allowGuest=true: guest boleh lewat (tanpa redirect)
 * - allowGuest=false: wajib login → redirect ke /login
 * - blokir role "disabled"
 */
export default function ProtectedRoute({ children, allowGuest = false }) {
  const { profile, loading, error } = useProfile();
  const location = useLocation();

  const isBlocked = useMemo(() => {
    if (!profile) return false;
    return profile.role === "disabled";
  }, [profile]);

  useEffect(() => {
    if (isBlocked) {
      supabase.auth.signOut().catch(() => {});
    }
  }, [isBlocked]);

  if (loading) {
    return <div className="p-4">⏳ Checking session…</div>;
  }

  if (!loading && error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load session. Please reload or login again.
      </div>
    );
  }

  // Guest diizinkan
  if (!profile && allowGuest) return children;

  // Wajib login
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Diblockir/suspended
  if (isBlocked) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: "suspended", from: location }}
        replace
      />
    );
  }

  return children;
}
