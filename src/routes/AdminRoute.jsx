// src/routes/AdminRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export default function AdminRoute({ children }) {
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (loading) {
    return <div className="p-4">⏳ Checking admin access…</div>;
  }

  if (!profile) {
    // belum login, simpan target path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile.role !== "admin") {
    // sudah login tapi bukan admin
    return <Navigate to="/unauthorized" replace />;
  }

  // admin → boleh akses children
  return children;
}
