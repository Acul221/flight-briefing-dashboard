// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";

/* ---------------- Public & Static ---------------- */
const DisclaimerPage   = lazy(() => import("./pages/DisclaimerPage"));
const PricingPage      = lazy(() => import("./pages/Pricing"));
const TermsPage        = lazy(() => import("./pages/legal/Terms"));
const RefundPolicyPage = lazy(() => import("./pages/legal/RefundPolicy"));
const PrivacyPage      = lazy(() => import("./pages/legal/Privacy"));
const ContactPage      = lazy(() => import("./pages/legal/Contact"));

/* ---------------- Auth ---------------- */
const LoginPage          = lazy(() => import("./pages/LoginPage"));
const SignupPage         = lazy(() => import("./pages/SignupPage"));
const Unauthorized       = lazy(() => import("./pages/Unauthorized"));
const ResetPasswordPage  = lazy(() => import("./pages/ResetPasswordPage"));

/* ---------------- User ---------------- */
const DashboardPage    = lazy(() => import("./pages/DashboardPage"));
const SettingsPage     = lazy(() => import("./pages/SettingsPage"));
const PrivacyToolsPage = lazy(() => import("./pages/PrivacyToolsPage"));

/* ---------------- Quiz & Exam ---------------- */
const OverviewPage    = lazy(() => import("./pages/quiz/OverviewPage"));
const SubCategoryGrid = lazy(() => import("./pages/quiz/SubCategoryGrid"));
const QuizPage        = lazy(() => import("./pages/QuizPage"));
const ResultPage      = lazy(() => import("./pages/ResultPage"));
const ExamPage        = lazy(() => import("./modules/exam/ExamPage"));
const QuizShell       = lazy(() => import("./layouts/QuizShell")); // ✅ new: sidebar shell for quiz

/* ---------------- Tools ---------------- */
const DelayPage          = lazy(() => import("./pages/Delay"));
const TimeTools          = lazy(() => import("./pages/TimeTools"));
const FlightComputerPage = lazy(() => import("./modules/flight-computer"));

/* ---------------- OCR & Logbook ---------------- */
const OcrPage      = lazy(() => import("./pages/OcrPage"));
const OcrTestPage  = lazy(() => import("./pages/OcrTestPage"));
const RoiTester    = lazy(() => import("./pages/RoiTester"));
const LogbookPrint = lazy(() => import("./pages/LogbookPrint"));

/* ---------------- Admin ---------------- */
const AdminDashboard        = lazy(() => import("./pages/AdminDashboard"));
const AdminPromos           = lazy(() => import("./pages/admin/AdminPromos"));
const AdminUsers            = lazy(() => import("./pages/admin/AdminUsers"));
const AdminOrders           = lazy(() => import("./pages/admin/AdminOrders"));
const AdminNewsletter       = lazy(() => import("./pages/admin/AdminNewsletter"));
const AdminCategories       = lazy(() => import("./pages/admin/CategoryManager"));
const AdminNewsletterDetail = lazy(() => import("./pages/admin/AdminNewsletterDetail"));

// 🔑 Master–Detail hub
const QuestionsHub          = lazy(() => import("./pages/admin/QuestionsHub"));

// Legacy editor/list (keep for deep link/backward compatibility)
const AdminQuestionEditorPage = lazy(() => import("./pages/admin/QuestionEditorPage"));
const QuestionsList           = lazy(() => import("./pages/admin/QuestionsList"));
const EditQuestionPage        = lazy(() => import("./pages/admin/EditQuestionPage"));

/* ---------------- Payments & Voucher ---------------- */
const BillingPage       = lazy(() => import("./pages/Billing"));
const PaymentResult     = lazy(() => import("./pages/PaymentResult"));
const RedeemVoucherPage = lazy(() => import("./pages/RedeemVoucherPage"));

/* ---------------- Debug Helper ---------------- */
function RouteDebugger() {
  const location = useLocation();
  useEffect(() => {
    console.log("[Route Change]", location.pathname + location.search + location.hash);
  }, [location]);
  return null;
}

export default function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <RouteDebugger />

      <Suspense fallback={<div className="p-6 text-center text-primary">Loading…</div>}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<DisclaimerPage />} />

          {/* Quiz (public) — wrapped with QuizShell (sidebar + content) */}
          <Route path="/quiz" element={<QuizShell />}>
            <Route index element={<OverviewPage />} />
            <Route path=":categorySlug" element={<SubCategoryGrid />} />
            <Route path=":categorySlug/:subjectSlug" element={<QuizPage />} />
            <Route path="result/:attemptId" element={<ResultPage />} />
          </Route>

          {/* Exam (protected) */}
          <Route
            path="/exam/:aircraft/:subject"
            element={
              <ProtectedRoute>
                <MainLayout><ExamPage /></MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Voucher (protected) */}
          <Route
            path="/redeem"
            element={
              <ProtectedRoute>
                <MainLayout><RedeemVoucherPage /></MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Static (public) */}
          <Route path="/pricing"       element={<MainLayout><PricingPage /></MainLayout>} />
          <Route path="/terms"         element={<MainLayout><TermsPage /></MainLayout>} />
          <Route path="/refund-policy" element={<MainLayout><RefundPolicyPage /></MainLayout>} />
          <Route path="/privacy"       element={<MainLayout><PrivacyPage /></MainLayout>} />
          <Route path="/contact"       element={<MainLayout><ContactPage /></MainLayout>} />

          {/* Tools (public) */}
          <Route path="/rac-delay"       element={<MainLayout><DelayPage /></MainLayout>} />
          <Route path="/time-tools"      element={<MainLayout><TimeTools /></MainLayout>} />
          <Route path="/flight-computer" element={<MainLayout><FlightComputerPage /></MainLayout>} />

          {/* OCR & Logbook (public) */}
          <Route path="/ocr"        element={<MainLayout><OcrPage /></MainLayout>} />
          <Route path="/ocr-test"   element={<OcrTestPage />} />
          <Route path="/roi-tester" element={<RoiTester />} />
          <Route path="/print"      element={<LogbookPrint />} />

          {/* Auth */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/unauthorized"    element={<Unauthorized />} />
          <Route path="/reset-password"  element={<MainLayout><ResetPasswordPage /></MainLayout>} />

          {/* Dashboard (protected, guest allowed) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowGuest>
                <MainLayout><DashboardPage /></MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Settings (protected) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout><SettingsPage /></MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy-tools"
            element={
              <ProtectedRoute>
                <MainLayout><PrivacyToolsPage /></MainLayout>
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
            <Route path="promos"      element={<AdminPromos />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="orders"      element={<AdminOrders />} />
            <Route path="newsletter"  element={<AdminNewsletter />} />
            <Route path="newsletter/:campaignId" element={<AdminNewsletterDetail />} />
            <Route path="categories"  element={<AdminCategories />} />

            {/* ✅ Master–Detail Questions Hub */}
            <Route path="questions" element={<QuestionsHub />} />

            {/* Legacy routes (keep working) */}
            <Route path="questions/new"    element={<AdminQuestionEditorPage />} />
            <Route path="questions/editor" element={<AdminQuestionEditorPage />} />
            <Route path="questions/list"   element={<QuestionsList />} />
            <Route path="questions/:id"    element={<EditQuestionPage />} />
          </Route>

          {/* Payments */}
          <Route path="/payment-result" element={<MainLayout><PaymentResult /></MainLayout>} />

          {/* Billing */}
          <Route path="/billing" element={<BillingPage />} />

          {/* Redirect old routes */}
          <Route path="/terms-id"         element={<Navigate to="/terms" replace />} />
          <Route path="/refund-policy-id" element={<Navigate to="/refund-policy" replace />} />
          <Route path="/kontak"           element={<Navigate to="/contact" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
