// src/pages/PaymentResult.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/lib/supabaseClient";

/** samakan logic dengan midtrans-notify.js */
function normStatus(s) {
  const v = (s || "").toLowerCase();
  if (v === "capture" || v === "settlement" || v === "success") return "success";
  if (v === "pending" || v === "authorize") return "pending";
  if (["deny", "expire", "cancel", "failed", "error", "refund"].includes(v)) return "failed";
  return v || "unknown";
}

function formatRupiah(num) {
  if (typeof num !== "number") return "-";
  return new Intl.NumberFormat("id-ID").format(num);
}

function getInvoiceUrl(orderId) {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || "";
  const path = `/.netlify/functions/invoice?orderId=${encodeURIComponent(orderId)}`;
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

export default function PaymentResult() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id") || params.get("orderId"); // guard dua versi
  const qpStatus = params.get("status"); // status dari redirect (cadangan awal)
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [firstFetchDone, setFirstFetchDone] = useState(false);
  const [error, setError] = useState(null);

  const status = useMemo(() => {
    // urutan prioritas: DB → query param → "pending"
    return normStatus(order?.status || qpStatus || "pending");
  }, [order?.status, qpStatus]);

  const chRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;

    async function fetchOnce() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("orders")
        .select("*, entitlements(expires_at)")
        .eq("order_id", orderId)
        .maybeSingle(); // pakai maybeSingle supaya tidak throw jika belum ada
      if (!mounted) return;

      if (error) {
        setError(error.message);
      } else {
        setOrder(data || null);
        setFirstFetchDone(true);
      }
      setLoading(false);
    }

    // 1) Fetch awal
    fetchOnce();

    // 2) Realtime subscription ke baris order tersebut
    chRef.current = supabase
      .channel(`orders-rt:${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setOrder((prev) => ({ ...(prev || {}), ...(payload.new || {}) }));
        }
      )
      .subscribe();

    // 3) Fallback polling (jaga-jaga webhook telat)
    // - Poll tiap 5 detik sampai status success/failed atau 2 menit (24x) kemudian berhenti
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries += 1;
      if (tries > 24) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        return;
      }
      const { data } = await supabase
        .from("orders")
        .select("*, entitlements(expires_at)")
        .eq("order_id", orderId)
        .maybeSingle();
      if (!mounted) return;
      if (data) setOrder(data);
      const st = normStatus(data?.status || "");
      if (st === "success" || st === "failed") {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 5000);

    return () => {
      mounted = false;
      if (chRef.current) supabase.removeChannel(chRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  // UI states
  if (!orderId) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center">
        <Helmet><title>Payment Result – SkyDeckPro</title></Helmet>
        <h1 className="text-2xl font-bold mb-2">Payment Result</h1>
        <p className="text-red-600">Missing <code>order_id</code></p>
        <div className="mt-6">
          <Link to="/pricing" className="px-4 py-2 rounded bg-blue-600 text-white">Back to Pricing</Link>
        </div>
      </div>
    );
  }

  const amount = order?.amount ?? null;
  const expiresAt = order?.entitlements?.[0]?.expires_at || null;
  const paymentType = order?.payment_type || params.get("payment_type") || null;

  let tone = "gray";
  let headline = "Payment status";
  let desc = "We’re checking your payment details…";
  if (status === "success") {
    tone = "green";
    headline = "Payment successful";
    desc = "Thank you! Your subscription is now active.";
  } else if (status === "pending") {
    tone = "yellow";
    headline = "Payment pending";
    desc = "We’re still waiting for the confirmation from the payment provider.";
  } else if (status === "failed") {
    tone = "red";
    headline = "Payment failed";
    desc = "Something went wrong with your transaction.";
  }

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <Helmet><title>Payment Result – SkyDeckPro</title></Helmet>

      <div className="mb-2">
        <Badge tone={tone}>{headline}</Badge>
      </div>
      <h1 className="text-2xl font-bold mb-2">Payment Result</h1>
      <p className="text-gray-600 mb-4">{desc}</p>

      <div className="space-y-1 text-gray-700">
        <p><span className="text-gray-500">Order ID:</span> {orderId}</p>
        {amount != null && <p><span className="text-gray-500">Amount:</span> Rp {formatRupiah(amount)}</p>}
        {paymentType && <p><span className="text-gray-500">Method:</span> {paymentType}</p>}
        <p>
          <span className="text-gray-500">Status:</span>{" "}
          <Badge tone={tone}>{status}</Badge>
        </p>
        {status === "success" && expiresAt && (
          <p className="text-gray-500">
            Subscription active until: {new Date(expiresAt).toLocaleDateString("id-ID")}
          </p>
        )}
      </div>

      {/* Loading / “not found yet” hint */}
      {loading && (
        <div className="mt-4 text-sm text-gray-500">
          Looking for your payment in our system…
        </div>
      )}
      {!loading && firstFetchDone && !order && (
        <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
          We haven’t received this order in our database yet. If you just paid, please wait a moment.
        </div>
      )}
      {error && (
        <div className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-6 flex justify-center flex-wrap gap-3">
        {status === "success" && (
          <a
            href={getInvoiceUrl(orderId)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90"
          >
            Download Invoice
          </a>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
        >
          Refresh
        </button>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded bg-gray-800 text-white hover:opacity-90"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Tiny helper text */}
      {status === "pending" && (
        <p className="mt-4 text-xs text-gray-500">
          Bank transfers can take a little longer. This page updates automatically once confirmed.
        </p>
      )}
    </div>
  );
}
