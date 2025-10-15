// src/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";

/* Layouts */
import MainLayout from "@/layouts/MainLayout";
import AdminLayout from "@/layouts/AdminLayout";

/* Public & Auth */
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Pricing from "@/pages/Pricing";
import Unauthorized from "@/pages/Unauthorized";

/* User */
import Dashboard from "@/pages/Dashboard";
import ProtectedRoute from "@/routes/ProtectedRoute";

/* Quiz (legacy routes not used) */
// Deprecated: use src/App.jsx routes with QuizShell

/* Admin guards */
import AdminRoute from "@/routes/AdminRoute";

/* Admin pages */
import AdminDashboard from "@/pages/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminPromos from "@/pages/admin/AdminPromos";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCategories from "@/pages/admin/CategoryManager";
import AdminQuestionEditor from "@/pages/admin/QuestionEditor";
import QuestionFormFull from "@/components/admin/QuestionFormFull"; // <- default export

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/"
        element={
          <MainLayout>
            <Landing />
          </MainLayout>
        }
      />
      <Route
        path="/login"
        element={
          <MainLayout>
            <Login />
          </MainLayout>
        }
      />
      <Route
        path="/pricing"
        element={
          <MainLayout>
            <Pricing />
          </MainLayout>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Quiz routes are defined in src/App.jsx with QuizShell */}

      {/* Dashboard (login optional) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowGuest>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin (strict) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="promos" element={<AdminPromos />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="categories" element={<AdminCategories />} />

        {/* Questions */}
        <Route path="questions" element={<AdminQuestionEditor />} />
        <Route path="questions/new" element={<QuestionFormFull />} />
        <Route path="questions/:id" element={<QuestionFormFull />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
