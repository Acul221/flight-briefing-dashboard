// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import AdminRoute from "@/routes/AdminRoute";
import BillingPage from "@/pages/Billing";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import { Toaster } from "react-hot-toast";

// Public & Static
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const PricingPage = lazy(() => import("./pages/Pricing"));
const TermsPage = lazy(() => import("./pages/TermsEN"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyEN"));
const PrivacyPage = lazy(() => import("./pages/PrivacyEN"));
const ContactPage = lazy(() => import("./pages/ContactEN"));

// Auth
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

// User
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PrivacyToolsPage = lazy(() => import("./pages/PrivacyToolsPage"));

// Quiz & Exam
const QuizSelector = lazy(() => import("./pages/QuizSelector"));
const SubjectSelector = lazy(() => import("./pages/SubjectSelector"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const QuizEditorMaster = lazy(() => import("./pages/QuizEditorMaster"));
const ExamPage = lazy(() => import("./modules/exam/ExamPage"));

// Tools
const DelayPage = lazy(() => import("./pages/Delay"));
const TimeTools = lazy(() => import("@/pages/TimeTools"));
const FlightComputerPage = lazy(() => import("@/modules/flight-computer"));

// OCR & Logbook
const OcrPage = lazy(() => import("./pages/OcrPage"));
const OcrTestPage = lazy(() => import("./pages/OcrTestPage"));
const RoiTester = lazy(() => import("./pages/RoiTester"));
const LogbookPrint = lazy(() => import("./pages/LogbookPrint"));

// Admin
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminPromos = lazy(() => import("./pages/AdminPromos"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminNewsletter = lazy(() => import("./pages/admin/AdminNewsletter"));

// Payments
const PaymentResult = lazy(() => import("./pages/PaymentResult"));

// Voucher
const RedeemVoucherPage = lazy(() => import("./pages/RedeemVoucherPage"));

/* Debug helper: log route changes */
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
      {/* Toast notifications */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Debug: log every route change (optional, bisa dihapus di production) */}
      <RouteDebugger />

      <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<DisclaimerPage />} />

          {/* Quiz (public) */}
          <Route
            path="/quiz"
            element={
              <MainLayout>
                <QuizSelector />
              </MainLayout>
            }
          />
          <Route
            path="/quiz/:aircraft"
            element={
              <MainLayout>
                <SubjectSelector />
              </MainLayout>
            }
          />
          <Route
            path="/quiz/:aircraft/:subject"
            element={
              <MainLayout>
                <QuizPage />
              </MainLayout>
            }
          />

          {/* Voucher (login required) */}
          <Route
            path="/redeem"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <RedeemVoucherPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Quiz Editor (admin) */}
          <Route
            path="/quiz-editor"
            element={
              <AdminRoute>
                <MainLayout>
                  <QuizEditorMaster />
                </MainLayout>
              </AdminRoute>
            }
          />

          {/* Static (public) */}
          <Route
            path="/pricing"
            element={
              <MainLayout>
                <PricingPage />
              </MainLayout>
            }
          />
          <Route
            path="/terms"
            element={
              <MainLayout>
                <TermsPage />
              </MainLayout>
            }
          />
          <Route
            path="/refund-policy"
            element={
              <MainLayout>
                <RefundPolicyPage />
              </MainLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <MainLayout>
                <PrivacyPage />
              </MainLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <MainLayout>
                <ContactPage />
              </MainLayout>
            }
          />

          {/* Tools (public) */}
          <Route
            path="/rac-delay"
            element={
              <MainLayout>
                <DelayPage />
              </MainLayout>
            }
          />
          <Route
            path="/time-tools"
            element={
              <MainLayout>
                <TimeTools />
              </MainLayout>
            }
          />
          <Route
            path="/flight-computer"
            element={
              <MainLayout>
                <FlightComputerPage />
              </MainLayout>
            }
          />

          {/* OCR & Logbook (public) */}
          <Route
            path="/ocr"
            element={
              <MainLayout>
                <OcrPage />
              </MainLayout>
            }
          />
          <Route path="/ocr-test" element={<OcrTestPage />} />
          <Route path="/roi-tester" element={<RoiTester />} />
          <Route path="/print" element={<LogbookPrint />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route
            path="/reset-password"
            element={
              <MainLayout>
                <ResetPasswordPage />
              </MainLayout>
            }
          />

          {/* Dashboard (login optional) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowGuest>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Settings (login required) */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/privacy-tools"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <PrivacyToolsPage />
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
            <Route path="promos" element={<AdminPromos />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
          </Route>

          {/* Payments */}
          <Route
            path="/payment-result"
            element={
              <MainLayout>
                <PaymentResult />
              </MainLayout>
            }
          />

          {/* Exam */}
          <Route
            path="/exam/:aircraft/:subject"
            element={
              <MainLayout>
                <ExamPage />
              </MainLayout>
            }
          />

          {/* Billing */}
          <Route path="/billing" element={<BillingPage />} />

          {/* Redirect old routes */}
          <Route path="/terms-id" element={<Navigate to="/terms" replace />} />
          <Route
            path="/refund-policy-id"
            element={<Navigate to="/refund-policy" replace />}
          />
          <Route path="/kontak" element={<Navigate to="/contact" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
