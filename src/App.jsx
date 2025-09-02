import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";

// ⏳ Lazy import existing pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DelayPage = lazy(() => import("./pages/Delay"));
const TimeTools = lazy(() => import("@/pages/TimeTools"));
const DisclaimerPage = lazy(() => import("@/pages/DisclaimerPage"));
const FlightComputerPage = lazy(() => import("@/modules/flight-computer"));
const OcrTestPage = lazy(() => import("./pages/OcrTestPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const QuizSelector = lazy(() => import("./pages/QuizSelector"));
const SubjectSelector = lazy(() => import("./pages/SubjectSelector"));
const QuizEditorMaster = lazy(() => import("./pages/QuizEditorMaster"));
const OcrPage = lazy(() => import("./pages/OcrPage"));
const RoiTester = lazy(() => import("./pages/RoiTester"));
const LogbookPrint = lazy(() => import("./pages/LogbookPrint"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPromos = lazy(() => import("./pages/AdminPromos"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
// ⏳ Lazy import new static pages (English only)
const PricingPage = lazy(() => import("./pages/Pricing"));
const TermsPage = lazy(() => import("./pages/TermsEN"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyEN"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const ContactPage = lazy(() => import("./pages/ContactEN"));

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<DisclaimerPage />} />

        {/* Quiz */}
        <Route path="/quiz" element={<MainLayout><QuizSelector /></MainLayout>} />
        <Route path="/quiz/:aircraft" element={<MainLayout><SubjectSelector /></MainLayout>} />
        <Route path="/quiz/:aircraft/:subject" element={<MainLayout><QuizPage /></MainLayout>} />
        <Route path="/quiz-editor" element={<MainLayout><QuizEditorMaster /></MainLayout>} />

        {/* Static Pages (English only) */}
        <Route path="/pricing" element={<MainLayout><PricingPage /></MainLayout>} />
        <Route path="/terms" element={<MainLayout><TermsPage /></MainLayout>} />
        <Route path="/refund-policy" element={<MainLayout><RefundPolicyPage /></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PrivacyPage /></MainLayout>} />
        <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />

        {/* Pages with layout */}
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/rac-delay" element={<MainLayout><DelayPage /></MainLayout>} />
        <Route path="/time-tools" element={<MainLayout><TimeTools /></MainLayout>} />
        <Route path="/flight-computer" element={<MainLayout><FlightComputerPage /></MainLayout>} />

        {/* OCR */}
        <Route path="/ocr" element={<MainLayout><OcrPage /></MainLayout>} />
        <Route path="/ocr-test" element={<OcrTestPage />} />
        <Route path="/roi-tester" element={<RoiTester />} />

        {/* Print view */}
        <Route path="/print" element={<LogbookPrint />} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🔐 Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/promos"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminPromos />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <MainLayout>
              <AdminRoute>
                <SettingsPage />
              </AdminRoute>
            </MainLayout>
          }
        />
        <Route path="/payment-result" element={<MainLayout><PaymentResult /></MainLayout>} />
        {/* Redirect old Indonesian routes → English */}
        <Route path="/terms-id" element={<Navigate to="/terms" replace />} />
        <Route path="/refund-policy-id" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/kontak" element={<Navigate to="/contact" replace />} />

        {/* Fallback */}
        <Route path="*" element={<MainLayout><DashboardPage /></MainLayout>} />
      </Routes>
    </Suspense>
  );
}
