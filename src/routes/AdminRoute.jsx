// src/routes/AdminRoute.jsx
import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useProfile } from "@/hooks/useProfile";

/**
 * AdminRoute
 * - Wajib login
 * - Tolak user role "disabled"
 * - Hanya izinkan role "admin"
 * - Redirect:
 *   - ke /login (bawa state.from) kalau belum login
 *   - ke /unauthorized kalau bukan admin / suspended
 */
export default function AdminRoute({ children }) {
  const { profile, loading, error } = useProfile();
  const location = useLocation();

  const isBlocked = useMemo(() => {
    if (!profile) return false;
    return profile.role === "disabled"; // bisa tambah: || profile.role === "banned"
  }, [profile]);

  // Auto sign-out kalau diblokir
  useEffect(() => {
    if (isBlocked) {
      supabase.auth.signOut().catch(() => {});
    }
  }, [isBlocked]);

  if (loading) {
    return <div className="p-4">⏳ Checking admin access…</div>;
  }

  if (!loading && error) {
    return (
      <div className="p-4 text-sm text-red-600">
        Failed to load session. Please reload or login again.
      </div>
    );
  }

  // Belum login → ke /login, simpan lokasi asal
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Akun diblokir/suspended
  if (isBlocked) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: "suspended", from: location }}
        replace
      />
    );
  }

  // Bukan admin → unauthorized
  if (profile.role !== "admin") {
    return (
      <Navigate
        to="/unauthorized"
        state={{ reason: "not_admin", from: location }}
        replace
      />
    );
  }

  // Admin lolos ✔️
  return children;
}
