// src/pages/Billing.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

function getInvoiceUrl(orderId) {
  const base = import.meta.env.VITE_PUBLIC_BASE_URL || "";
  const path = `/.netlify/functions/invoice?orderId=${encodeURIComponent(orderId)}`;
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}
function Badge({ tone="gray", children }) {
  const c = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  }[tone];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{children}</span>;
}
function toneByStatus(s) {
  const v = (s||"").toLowerCase();
  if (v === "success") return "green";
  if (v === "pending") return "yellow";
  if (v === "failed") return "red";
  return "gray";
}

export default function BillingPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user || null);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    load();

    const ch = supabase.channel(`billing-rt-${user.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` },
        load)
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, [user?.id]);

  if (!user) return <div className="p-6">Please login.</div>;
  if (loading) return <div className="p-6">Loading billing…</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Billing</h1>
      {orders.length === 0 ? (
        <div className="p-4 rounded-xl border bg-white dark:bg-gray-900">
          No orders yet. <Link to="/pricing" className="text-blue-600 underline">See plans</Link>.
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left">Order ID</th>
                <th className="px-3 py-2 text-left">Plan</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.order_id} className="border-t">
                  <td className="px-3 py-2 font-mono">{o.order_id}</td>
                  <td className="px-3 py-2">{o.plan || "-"}</td>
                  <td className="px-3 py-2 text-right">Rp {new Intl.NumberFormat("id-ID").format(o.amount ?? 0)}</td>
                  <td className="px-3 py-2"><Badge tone={toneByStatus(o.status)}>{o.status}</Badge></td>
                  <td className="px-3 py-2">{o.payment_type || "-"}</td>
                  <td className="px-3 py-2">{new Date(o.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-3 py-2 text-right space-x-2">
                    <Link to={`/payment-result?order_id=${o.order_id}`} className="underline">View</Link>
                    {o.status === "success" && (
                      <a href={getInvoiceUrl(o.order_id)} target="_blank" rel="noreferrer" className="underline">
                        Invoice
                      </a>
                    )}
                    {o?.meta?.midtrans?.redirect_url && o.status === "pending" && (
                      <a href={o.meta.midtrans.redirect_url} className="underline">Resume payment</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
