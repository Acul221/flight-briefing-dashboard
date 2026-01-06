// src/routes/AdminRoute.jsx
import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

export default function AdminRoute({ children }) {
  const { profile, loading, error } = useProfile();
  const location = useLocation();
  const envBypass = String(import.meta.env.VITE_ADMIN_ROUTE_BYPASS || "").toLowerCase() === "true";
  const runtimeBypass =
    typeof window !== "undefined" && window.localStorage?.getItem("ADMIN_ROUTE_BYPASS") === "1";

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
    return <div className="p-4">Checking admin access…</div>;
  }

  if (envBypass || runtimeBypass) {
    return children;
  }

  if (!loading && error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load session. Please reload or login again.
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isBlocked) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: "suspended", from: location }}
        replace
      />
    );
  }

  if (profile.role !== "admin") {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: "not_admin", from: location }}
        replace
      />
    );
  }

  return children;
}

