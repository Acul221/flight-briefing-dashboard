// src/pages/Pricing.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import SubscribeGateModal from "@/components/pricing/SubscribeGateModal";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/analytics";

// ===== Plans (UI copy) =====
const PLANS = [
  { id: "free",   label: "Free",   price: "Rp 0",               description: "Limited quiz access",               cta: "Try free" },
  { id: "pro",    label: "Pro",    price: "Rp 60.000 / month",  description: "Full access to all question banks", cta: "Subscribe" },
  { id: "bundle", label: "Bundle", price: "Rp 90.000 / month",  description: "Quiz + upcoming features",          cta: "Subscribe" },
];

// ===== TEMP pricing (FE) — pindahkan ke server secepatnya =====
const AMOUNTS = {
  pro: 60000,
  bundle: 90000,
};

function baseUrl() {
  // gunakan origin lokal / prod otomatis
  return window.location.origin.replace(/\/$/, "");
}

export default function PricingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading: sessionLoading } = useSession();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const highlightPlan = (query.get("plan") || "").toLowerCase();

  const [gateOpen, setGateOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isGuest = !session;

  useEffect(() => {
    try {
      logEvent("pricing_view", { highlightPlan });
    } catch {
      /* noop */
    }
  }, [highlightPlan]);

  const toLogin = () => {
    const redirect = encodeURIComponent(`/pricing${highlightPlan ? `?plan=${highlightPlan}` : ""}`);
    navigate(`/login?from=${redirect}`, { replace: false });
  };

  const toSignup = () => {
    const redirect = encodeURIComponent(`/pricing${highlightPlan ? `?plan=${highlightPlan}` : ""}`);
    navigate(`/signup?from=${redirect}`, { replace: false });
  };

  async function startCheckout(planId) {
    setSubmitting(true);
    setErrorMsg("");

    try {
      try {
        logEvent("pricing_subscribe_click", { plan: planId });
      } catch {
        /* noop */
      }

      // 1) Pastikan user sudah login (double-check dari Supabase)
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s?.user?.id) {
        setPendingPlan({ id: planId, label: PLANS.find(p => p.id === planId)?.label || planId });
        setGateOpen(true);
        return;
      }

      // 2) Validasi plan & amount (sementara, sebaiknya dipindahkan ke server)
      const amount = AMOUNTS[planId];
      if (!amount) throw new Error(`Unknown plan: ${planId}`);

      // 3) Call Netlify Function → create Midtrans Snap session
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          amount,              // TODO: validate/overwrite di server
          user_id: s.user.id,
          email: s.user.email,
          success_url: `${baseUrl()}/payment-result`,       // kita pakai order_id utk fetch realtime
          cancel_url: `${baseUrl()}/pricing?canceled=1`,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      }

      const { token, snap_token, redirect_url, order_id } = data;
      const useToken = token || snap_token;

      // 4) Prefer Snap popup jika script tersedia
      if (useToken && window?.snap?.pay) {
        window.snap.pay(useToken, {
          onSuccess: () => (window.location.href = `/payment-result?order_id=${encodeURIComponent(order_id)}`),
          onPending: () => (window.location.href = `/payment-result?order_id=${encodeURIComponent(order_id)}`),
          onError:   () => (window.location.href = `/payment-result?order_id=${encodeURIComponent(order_id)}&status=failed`),
          onClose:   () => {}, // user menutup popup → biarkan tetap di Pricing
        });
        return;
      }

      // 5) Fallback: redirect ke URL Snap
      if (redirect_url) {
        window.location.href = redirect_url;
        return;
      }

      throw new Error("Missing Snap token/redirect_url");
    } catch (e) {
      console.error("checkout error:", e);
      setErrorMsg("Couldn’t start checkout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubscribeClick(planId, planLabel) {
    setPendingPlan({ id: planId, label: planLabel });

    if (!session) {
      try {
        logEvent("pricing_gate_open", { plan: planId });
      } catch {
        /* noop */
      }
      setGateOpen(true);
      return;
    }
    startCheckout(planId);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-gray-900 dark:text-white">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Plans</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All prices are shown in Indonesian Rupiah (IDR).
        </p>
      </header>

      {/* Guest banner */}
      {isGuest && !sessionLoading && (
        <div className="mb-4 flex items-center justify-between gap-3 px-3 py-2 text-sm rounded-lg border bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs">i</span>
            <p className="text-blue-900/90 dark:text-blue-100">
              Create a free account to subscribe and sync your progress.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toSignup} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">
              Sign up
            </button>
            <button onClick={toLogin} className="px-3 py-1 rounded border border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20">
              Login
            </button>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((p) => {
          const highlighted = p.id === highlightPlan;
          const isFree = p.id === "free";
          return (
            <div
              key={p.id}
              className={`rounded-xl border shadow-sm p-4 bg-white dark:bg-gray-900 ${
                highlighted ? "border-blue-500 ring-2 ring-blue-400/50" : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <h3 className="text-lg font-semibold">{p.label}</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{p.price}</p>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{p.description}</p>

              <button
                disabled={!isFree && submitting}
                onClick={isFree ? () => (window.location.href = "/quiz") : () => handleSubscribeClick(p.id, p.label)}
                className={`mt-4 w-full rounded py-2 ${
                  isFree
                    ? "border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                    : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                }`}
              >
                {isFree ? p.cta : (submitting ? "Processing..." : p.cta)}
              </button>

              {highlighted && (
                <p className="mt-2 text-[11px] text-blue-700 dark:text-blue-300 italic">
                  Recommended for most pilots
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Error surface */}
      {errorMsg && (
        <div className="mt-4 p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Gate modal (guest) */}
      <SubscribeGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onLogin={toLogin}
        onSignup={toSignup}
        planLabel={pendingPlan?.label || "Pro"}
      />
    </div>
  );
}
