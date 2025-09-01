// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export default function ProtectedRoute({ children }) {
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (loading) {
    return <div className="p-4">⏳ Checking session…</div>;
  }

  if (!profile) {
    // simpan lokasi asal (from) ke state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
