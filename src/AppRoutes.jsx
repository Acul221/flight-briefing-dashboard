// src/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Pricing from "@/pages/Pricing";
import Unauthorized from "@/pages/Unauthorized";
import SubjectSelector from "@/pages/SubjectSelector";
import QuizPage from "@/pages/QuizPage";

import AdminOrders from "@/pages/admin/AdminOrders";
import AdminPromos from "@/pages/admin/AdminPromos";
import AdminUsers from "@/pages/admin/AdminUsers";

import AdminRoute from "@/routes/AdminRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Quiz public (gating di dalam page) */}
      <Route path="/quiz/:aircraft" element={<SubjectSelector />} />
      <Route path="/quiz/:aircraft/:subject" element={<QuizPage />} />

      {/* Dashboard: login opsional */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowGuest>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin only */}
      <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminOrders />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/promos"
        element={
          <AdminRoute>
            <AdminPromos />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminUsers />
          </AdminRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
