// src/pages/SettingsPage.jsx
import { useEffect, useState, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

import Breadcrumb from "@/components/ui/Breadcrumb";
import QuizEditorMaster from "@/pages/QuizEditorMaster";
import PasteNotamForm from "@/components/PasteNotamForm";
import AdminPromos from "@/pages/admin/AdminPromos";

import { useSession } from "@/hooks/useSession";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";

// Admin only (lazy)
const AdminRACSettings = lazy(() => import("@/pages/admin/AdminRACSettings.jsx"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

export default function SettingsPage() {
  // accordions (tetap ada seperti sebelumnya)
  const [showRacSettings, setShowRacSettings] = useState(false);
  const [showPromos, setShowPromos] = useState(false);
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const [showNotamUploader, setShowNotamUploader] = useState(false);
  const [showRoiTester, setShowRoiTester] = useState(false);

  // forms
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", newsletter_opt_in: false });
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirm: "" });

  const [orders, setOrders] = useState([]);

  const navigate = useNavigate();
  const { session, loading: loadingSession } = useSession();
  const { profile, loading: loadingProfile } = useProfile();
  const { status, isPro, current } = useSubscription();

  const isLoading = loadingSession || loadingProfile;
  const isLoggedIn = !!session;
  const isAdmin = profile?.role === "admin";
  const userId = session?.user?.id || null;

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        newsletter_opt_in: !!profile.newsletter_opt_in,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      navigate("/login", { state: { from: "/settings" }, replace: true });
    }
  }, [isLoading, isLoggedIn, navigate]);

  // invoice history (user only, ringan)
  useEffect(() => {
    (async () => {
      if (!userId) return;
      const { data } = await supabase
        .from("orders")
        .select("order_id,status,amount,created_at,plan,payment_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      setOrders(Array.isArray(data) ? data : []);
    })();
  }, [userId]);

  const planText = isPro ? (current?.plan || "Pro") : "Free";
  const expires = current?.current_period_end
    ? new Date(current.current_period_end).toLocaleDateString()
    : null;

  if (isLoading) return <div className="p-6">Loading settings…</div>;

  /* ------------ handlers ------------ */
  async function saveProfile(e) {
    e.preventDefault();
    if (!userId) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileForm.full_name,
          newsletter_opt_in: profileForm.newsletter_opt_in,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      if (error) throw error;
      alert("Profile updated.");
    } catch (err) {
      console.error(err);
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      alert("Password confirmation does not match.");
      return;
    }
    setChangingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      setPasswordForm({ newPassword: "", confirm: "" });
      alert("Password updated.");
    } catch (err) {
      console.error(err);
      alert("Failed to update password.");
    } finally {
      setChangingPass(false);
    }
  }

  async function signOutAll() {
    try {
      await supabase.auth.signOut({ scope: "global" });
      navigate("/login", { replace: true });
    } catch (e) {
      console.error(e);
      alert("Failed to sign out on all devices.");
    }
  }

  /* ------------- UI ------------- */
  return (
    <div className="p-6 space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: "Settings" }]} />

      {/* header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Settings</h2>
          <p className="text-sm text-gray-600">
            Manage your profile, security, billing, and tools. Advanced privacy actions are moved to a separate page.
          </p>
        </div>
        {isAdmin && (
          <Link
            to="/admin"
            className="px-3 py-1.5 rounded bg-gray-900 text-white text-sm hover:bg-black"
          >
            Admin Area
          </Link>
        )}
      </div>

      {/* Account & Security (ringan) */}
      <Card title="Account & Security">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* profile */}
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Email">
              <input
                className="w-full rounded border px-3 py-2 bg-gray-100 dark:bg-slate-800"
                value={session?.user?.email || ""}
                disabled
              />
            </Field>
            <Field label="Full Name">
              <input
                className="w-full rounded border px-3 py-2"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </Field>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={profileForm.newsletter_opt_in}
                onChange={(e) =>
                  setProfileForm((f) => ({ ...f, newsletter_opt_in: e.target.checked }))
                }
              />
              Subscribe to newsletter
            </label>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving…" : "Save Profile"}
            </button>
          </form>

          {/* password & sign-out */}
          <div className="space-y-3">
            <form onSubmit={changePassword} className="space-y-3">
              <Field label="New Password">
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="At least 8 characters"
                />
              </Field>
              <Field label="Confirm Password">
                <input
                  type="password"
                  className="w-full rounded border px-3 py-2"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                />
              </Field>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={changingPass}
              >
                {changingPass ? "Updating…" : "Change Password"}
              </button>
            </form>

            <div className="pt-2">
              <button
                onClick={signOutAll}
                className="px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Sign out all devices
              </button>
              <Link
                to="/help/2fa"
                className="ml-2 px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-slate-700"
                title="2FA setup (coming soon)"
              >
                Two-Factor Authentication
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Billing & Subscription */}
      <Card title="Billing & Subscription" subtitle="Manage plan, invoices and payments.">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Badge tone={isPro ? "green" : status === "inactive" ? "yellow" : "gray"}>
            {isPro ? "Active Pro" : status === "inactive" ? "Inactive" : "Free/Guest"}
          </Badge>
          <span className="text-sm text-gray-600">Plan: {planText}</span>
          {isPro && expires && <span className="text-sm text-gray-600">Expires: {expires}</span>}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {!isPro && (
            <Link to="/pricing" className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700">
              Upgrade to Pro
            </Link>
          )}
          <Link
            to="/admin/orders"
            className="px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            View Orders
          </Link>
          {!isPro && (
            <a
              href="/pricing#checkout"
              className="px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Start Checkout
            </a>
          )}
        </div>

        {/* invoice list */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Order ID</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={6}>
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.order_id} className="border-t">
                  <td className="py-2 pr-4">{new Date(o.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{o.order_id}</td>
                  <td className="py-2 pr-4">{o.plan || "-"}</td>
                  <td className="py-2 pr-4">Rp {Number(o.amount || 0).toLocaleString("id-ID")}</td>
                  <td className="py-2 pr-4 capitalize">{o.status}</td>
                  <td className="py-2 pr-4">
                    <a
                      href={`/.netlify/functions/invoice?orderId=${encodeURIComponent(o.order_id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Download Invoice
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* link kecil ke privacy tools */}
        <p className="mt-3 text-xs text-gray-500">
          Need a full data export or account deletion? Use{" "}
          <Link to="/privacy-tools" className="underline">
            Privacy Tools
          </Link>
          .
        </p>
      </Card>

      {/* Admin (role-gated) – tetap seperti sebelumnya */}
      {isAdmin && (
        <>
          <Accordion
            title="Show RAC Settings"
            open={showRacSettings}
            onToggle={() => setShowRacSettings((v) => !v)}
          >
            <p className="text-sm text-gray-600 mb-3">
              Configure Deviation Thresholds & Offsets per checkpoint. Changes apply to the RAC Delay page.
            </p>
            <Suspense fallback={<div className="text-sm text-gray-500">Loading RAC Settings…</div>}>
              <AdminRACSettings />
            </Suspense>
          </Accordion>

          <Accordion title="Show Promos" open={showPromos} onToggle={() => setShowPromos((v) => !v)}>
            <AdminPromos />
          </Accordion>

          <Accordion
            title="Show Quiz Editor"
            open={showQuizEditor}
            onToggle={() => setShowQuizEditor((v) => !v)}
          >
            <div className="mt-2 border-t pt-4">
              <QuizEditorMaster />
            </div>
          </Accordion>

          <Accordion
            title="Show NOTAM Uploader"
            open={showNotamUploader}
            onToggle={() => setShowNotamUploader((v) => !v)}
          >
            <div className="mt-2 border-t pt-4">
              <PasteNotamForm />
            </div>
          </Accordion>

          <Accordion
            title="Show ROI Tester"
            open={showRoiTester}
            onToggle={() => setShowRoiTester((v) => !v)}
          >
            <p className="text-sm text-gray-600 mb-2">Open ROI Tester to adjust OCR scan areas.</p>
            <Link
              to="/roi-tester"
              className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Open ROI Tester
            </Link>
          </Accordion>

          <Card title="Admin Dashboard (Embedded)" subtitle="Quick view without leaving Settings.">
            <div className="rounded-xl border overflow-hidden">
              <Suspense fallback={<div className="p-6">Loading admin widgets…</div>}>
                <AdminDashboard />
              </Suspense>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ---- helpers ---- */
function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}
function Accordion({ title, open, onToggle, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <button
        onClick={onToggle}
        className="w-full text-left font-medium text-blue-600 dark:text-blue-400 hover:underline"
      >
        {open ? `▼ Hide ${title.replace(/^Show\s+/i, "")}` : `▶ ${title}`}
      </button>
      {open && <div className="mt-4 border-t pt-4">{children}</div>}
    </div>
  );
}
function Badge({ children, tone = "gray" }) {
  const color =
    tone === "green"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : tone === "yellow"
      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{children}</span>;
}
