// src/components/dashboard/BillingStrip.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

function formatIDR(n) {
  return new Intl.NumberFormat("id-ID").format(n ?? 0);
}
function getInvoiceUrl(orderId) {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || "";
  const path = `/.netlify/functions/invoice?orderId=${encodeURIComponent(orderId)}`;
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}
function daysUntil(dateISO) {
  if (!dateISO) return null;
  const ms = new Date(dateISO).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
const AMOUNTS = { pro: 60000, bundle: 90000 }; // Hanya dipakai jika server belum server-priced

export default function BillingStrip() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ent, setEnt] = useState(null); // active entitlement
  const [lastOrder, setLastOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const debRef = useRef(null);

  // ensure session
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.session?.user || null);
    });
    return () => { mounted = false; };
  }, []);

  // fetch entitlement & last order
  const fetchData = async (uid) => {
    if (!uid) return;
    setLoading(true);
    const [{ data: entRows }, { data: orderRows }] = await Promise.all([
      supabase
        .from("entitlements")
        .select("*")
        .eq("user_id", uid)
        .in("product_code", ["quiz_pro", "quiz_bundle"])
        .eq("status", "active")
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("expires_at", { ascending: false })
        .limit(1),
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    setEnt(entRows?.[0] || null);
    setLastOrder(orderRows?.[0] || null);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchData(user.id);

    // realtime: refetch saat ada perubahan pada orders/entitlements user ini
    const ch1 = supabase.channel(`rt-orders-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        () => {
          clearTimeout(debRef.current);
          debRef.current = setTimeout(() => fetchData(user.id), 300);
        })
      .subscribe();
    const ch2 = supabase.channel(`rt-ent-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "entitlements", filter: `user_id=eq.${user.id}` },
        () => {
          clearTimeout(debRef.current);
          debRef.current = setTimeout(() => fetchData(user.id), 300);
        })
      .subscribe();
    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
      clearTimeout(debRef.current);
    };
  }, [user?.id]);

  // status terderivasi
  const expiresAt = ent?.expires_at || null;
  const dLeft = useMemo(() => daysUntil(expiresAt), [expiresAt]);
  const active = !!ent;
  const showRenew = active && (dLeft !== null && dLeft <= 14);

  // helper: pastikan Snap loaded
  async function ensureSnap() {
    if (window.snap) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      s.setAttribute("data-client-key", import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
      s.onload = resolve; s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // start checkout (default ke 'pro')
  async function startCheckout(planId = "pro") {
    if (!user?.id) {
      navigate("/login?from=" + encodeURIComponent("/dashboard"));
      return;
    }
    setSubmitting(true);
    try {
      await ensureSnap();
      const res = await fetch("/.netlify/functions/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          // amount: AMOUNTS[planId], // HAPUS baris ini jika server sudah server-priced
          user_id: user.id,
          email: user.email,
          success_url: `${window.location.origin}/payment-result`,
          cancel_url: `${window.location.origin}/dashboard`,
        }),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || "Checkout failed");

      if (out.token && window.snap) {
        window.snap.pay(out.token, {
          onSuccess: () => (window.location.href = `/payment-result?order_id=${out.order_id}`),
          onPending: () => (window.location.href = `/payment-result?order_id=${out.order_id}`),
          onError:   () => (window.location.href = `/payment-result?order_id=${out.order_id}&status=failed`),
          onClose:   () => {},
        });
      } else if (out.redirect_url) {
        window.location.href = out.redirect_url;
      } else {
        throw new Error("Missing Snap token/redirect_url");
      }
    } catch (e) {
      console.error("billing startCheckout error:", e);
      alert("Couldn’t start checkout. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null; // not logged in → biarkan banner guest-mu yang tampil
  if (loading) {
    return (
      <div className="mb-4 p-4 rounded-xl border bg-white dark:bg-gray-900 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    );
  }

  return (
    <div className="mb-4 p-4 rounded-xl border bg-white dark:bg-gray-900 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="space-y-1">
        {active ? (
          <>
            <div className="text-sm">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium mr-2">Pro Active</span>
              <span className="text-gray-600 dark:text-gray-300">
                {expiresAt ? <>Expires on <b>{new Date(expiresAt).toLocaleDateString("id-ID")}</b> ({dLeft} day{Math.abs(dLeft) === 1 ? "" : "s"} left)</> : "No expiry"}
              </span>
            </div>
            {lastOrder?.order_id && (
              <div className="text-xs text-gray-500">
                Last order: <span className="font-mono">{lastOrder.order_id}</span>
                {" • "}
                <Link className="underline hover:no-underline" to={`/payment-result?order_id=${lastOrder.order_id}`}>View status</Link>
                {" • "}
                <a className="underline hover:no-underline" href={getInvoiceUrl(lastOrder.order_id)} target="_blank" rel="noreferrer">
                  Download invoice
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-sm">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium mr-2">Free plan</span>
              <span className="text-gray-600 dark:text-gray-300">Upgrade to unlock full question banks & upcoming features.</span>
            </div>
            {lastOrder?.status === "pending" && (
              <div className="text-xs text-gray-500">
                You have a pending order (<span className="font-mono">{lastOrder.order_id}</span>).{" "}
                <Link className="underline hover:no-underline" to={`/payment-result?order_id=${lastOrder.order_id}`}>Check status</Link>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2">
        {!active && (
          <>
            <button
              onClick={() => startCheckout("pro")}
              disabled={submitting}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Starting…" : "Upgrade to Pro"}
            </button>
            <Link
              to="/pricing"
              className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              See Plans
            </Link>
          </>
        )}
        {active && (
          <>
            {showRenew && (
              <button
                onClick={() => startCheckout(ent.product_code === "quiz_bundle" ? "bundle" : "pro")}
                disabled={submitting}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Starting…" : "Renew now"}
              </button>
            )}
            <Link
              to="/billing"
              className="px-4 py-2 rounded border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Billing
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
