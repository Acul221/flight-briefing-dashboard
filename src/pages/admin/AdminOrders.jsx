import { useEffect, useState } from "react";
import { supabase } from "@/lib/apiClient";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

const formatIDR = (n) => (n ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [trend, setTrend] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [entitlements, setEntitlements] = useState([]);
  const [churn, setChurn] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("transaction_time", { ascending: false })
      .limit(1000);
    if (error) { console.error(error); toast.error("Gagal load orders"); }
    else setOrders(data || []);
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    const [{ data: t }, { data: m }, { data: ent }, { data: ch }, { data: top }] =
      await Promise.all([
        supabase.from("revenue_trend").select("*"),
        supabase.from("monthly_revenue").select("*"),
        supabase.from("active_entitlements").select("*"),
        supabase.from("churn_rate").select("*"),
        supabase.from("top_customers").select("*"),
      ]);
    setTrend(t || []); setMonthly(m || []); setEntitlements(ent || []); setChurn(ch || []); setTopCustomers(top || []);
  };

  useEffect(() => {
    fetchOrders();
    fetchAnalytics();

    const sub = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") setOrders((prev) => [payload.new, ...prev]);
        else if (payload.eventType === "UPDATE") setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
        toast.success("🔔 Order updated!");
        fetchAnalytics();
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchPayment = paymentFilter === "all" || o.payment_type === paymentFilter;
    const matchPlan = planFilter === "all" || o.plan === planFilter;

    const oid = (o.order_id ?? "").toString().toLowerCase();
    const matchSearch = !search || oid.includes(search.toLowerCase());

    const txDate = o.transaction_time ? new Date(o.transaction_time) : null;
    const matchFrom = dateFrom ? (txDate && txDate >= new Date(dateFrom)) : true;
    const matchTo = dateTo ? (txDate && txDate <= new Date(new Date(dateTo).setHours(23, 59, 59))) : true;

    return matchStatus && matchPayment && matchPlan && matchSearch && matchFrom && matchTo;
  });

  const startIndex = (page - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const total = filteredOrders.length;
  const successCount = filteredOrders.filter((o) => o.status === "success").length;
  const pendingCount = filteredOrders.filter((o) => o.status === "pending").length;
  const failedCount = filteredOrders.filter((o) => o.status === "failed" || o.status === "expire").length;
  const revenue = filteredOrders.filter((o) => o.status === "success").reduce((sum, o) => sum + (o.amount || 0), 0);

  const totalActive = entitlements.reduce((sum, e) => sum + (e.active_users || 0), 0);
  const arpu = totalActive > 0 ? Math.round(revenue / totalActive) : 0;

  const exportCSV = () => {
    const header = ["Order ID", "User ID", "Plan", "Amount", "Status", "Payment Type", "Transaction Time"];
    const rows = filteredOrders.map((o) => [
      o.order_id, o.user_id || "-", o.plan || "-", o.amount ?? 0, o.status, o.payment_type || "-",
      o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => (typeof c === "string" && c.includes(",") ? `"${c}"` : c)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success("✅ Exported to CSV");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16); doc.text("Orders Report – SkyDeckPro", 14, 14);
    const head = ["Order ID", "User ID", "Plan", "Amount (Rp)", "Status", "Payment Type", "Transaction Time"];
    const body = filteredOrders.map((o) => [
      o.order_id, o.user_id || "-", o.plan || "-", `Rp ${formatIDR(o.amount)}`, o.status, o.payment_type || "-",
      o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-",
    ]);
    autoTable(doc, { head: [head], body, startY: 22, styles: { fontSize: 9 }, headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [245, 245, 245] }, margin: { left: 12, right: 12 } });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString("id-ID")}`, 12, doc.internal.pageSize.getHeight() - 8);
      const footer = `Page ${i} of ${pageCount}`;
      doc.text(footer, doc.internal.pageSize.getWidth() - 12 - doc.getTextWidth(footer), doc.internal.pageSize.getHeight() - 8);
    }
    doc.save("orders.pdf"); toast.success("📄 Exported to PDF");
  };

  const exportExcel = () => {
    const data = filteredOrders.map((o) => ({
      "Order ID": o.order_id, "User ID": o.user_id || "-", Plan: o.plan || "-", Amount: o.amount ?? 0, Status: o.status,
      "Payment Type": o.payment_type || "-", "Transaction Time": o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders.xlsx"); toast.success("📊 Exported to Excel");
  };

  const COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa"];

  return (
    <div className="max-w-7xl mx-auto p-6 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">📊 Orders Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Orders" value={total} color="blue" />
        <StatCard title="Success" value={successCount} color="green" />
        <StatCard title="Pending" value={pendingCount} color="yellow" />
        <StatCard title="Failed / Expired" value={failedCount} color="red" />
        <StatCard title="ARPU (Rp)" value={formatIDR(arpu)} color="blue" />
      </div>

      <div className="p-4 bg-purple-50 dark:bg-purple-900/40 rounded-xl shadow mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">Total Revenue (filtered)</p>
        <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">Rp {formatIDR(revenue)}</p>
      </div>

      <Filters
        filter={filter} setFilter={setFilter}
        search={search} setSearch={setSearch}
        paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
        planFilter={planFilter} setPlanFilter={setPlanFilter}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        exportCSV={exportCSV} exportPDF={exportPDF} exportExcel={exportExcel}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Revenue Trend (Daily)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Payment Types</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={Object.entries(
                  filteredOrders.reduce((acc, o) => {
                    const key = o.payment_type || "Unknown";
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                label
              >
                {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Top Customers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">User ID</th>
                  <th className="border px-2 py-1">Orders</th>
                  <th className="border px-2 py-1">Total Spent (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr key={c.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="border px-2 py-1">{c.user_id}</td>
                    <td className="border px-2 py-1">{c.total_orders}</td>
                    <td className="border px-2 py-1">{formatIDR(c.total_spent)}</td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr><td className="border px-2 py-2 text-center" colSpan={3}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Active Entitlements</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Product</th>
                  <th className="border px-2 py-1">Active</th>
                  <th className="border px-2 py-1">Expired</th>
                  <th className="border px-2 py-1">Cancelled</th>
                </tr>
              </thead>
              <tbody>
                {entitlements.map((e) => (
                  <tr key={e.product_code} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="border px-2 py-1">{e.product_code}</td>
                    <td className="border px-2 py-1">{e.active_users}</td>
                    <td className="border px-2 py-1">{e.expired_users}</td>
                    <td className="border px-2 py-1">{e.cancelled_users}</td>
                  </tr>
                ))}
                {entitlements.length === 0 && (
                  <tr><td className="border px-2 py-2 text-center" colSpan={4}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Churn Rate</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Product</th>
                  <th className="border px-2 py-1">Active</th>
                  <th className="border px-2 py-1">Expired</th>
                  <th className="border px-2 py-1">Churn %</th>
                </tr>
              </thead>
              <tbody>
                {churn.map((c) => (
                  <tr key={c.product_code} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="border px-2 py-1">{c.product_code}</td>
                    <td className="border px-2 py-1">{c.active_users}</td>
                    <td className="border px-2 py-1">{c.expired_users}</td>
                    <td className="border px-2 py-1">{c.churn_percent}%</td>
                  </tr>
                ))}
                {churn.length === 0 && (
                  <tr><td className="border px-2 py-2 text-center" colSpan={4}>No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <OrdersTable pagedOrders={pagedOrders} />
          <PaginationControls page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-300",
    green: "text-green-600 dark:text-green-300",
    yellow: "text-yellow-600 dark:text-yellow-300",
    red: "text-red-600 dark:text-red-300",
  };
  return (
    <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-800">
      <p className="text-sm text-gray-600 dark:text-gray-300">{title}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function Filters({
  filter, setFilter, search, setSearch,
  paymentFilter, setPaymentFilter, planFilter, setPlanFilter,
  dateFrom, setDateFrom, dateTo, setDateTo,
  exportCSV, exportPDF, exportExcel
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <select className="border rounded px-3 py-2 dark:bg-gray-800" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="success">Success</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="expire">Expired</option>
      </select>

      <select className="border rounded px-3 py-2 dark:bg-gray-800" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
        <option value="all">All Payments</option>
        <option value="qris">QRIS</option>
        <option value="va">Virtual Account</option>
        <option value="cc">Credit Card</option>
        <option value="gopay">GoPay</option>
      </select>

      <select className="border rounded px-3 py-2 dark:bg-gray-800" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
        <option value="all">All Plans</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="bundle">Bundle</option>
      </select>

      <input type="date" className="border rounded px-2 py-1 dark:bg-gray-800" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
      <input type="date" className="border rounded px-2 py-1 dark:bg-gray-800" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />

      <input
        type="text"
        placeholder="Search Order ID..."
        className="flex-1 border rounded px-3 py-2 dark:bg-gray-800"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2">
        <button onClick={exportCSV} className="bg-blue-600 text-white px-4 py-2 rounded-lg">CSV</button>
        <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg">PDF</button>
        <button onClick={exportExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg">Excel</button>
      </div>
    </div>
  );
}

function OrdersTable({ pagedOrders }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-left">
            <th className="p-2 border dark:border-gray-700">Order ID</th>
            <th className="p-2 border dark:border-gray-700">User ID</th>
            <th className="p-2 border dark:border-gray-700">Plan</th>
            <th className="p-2 border dark:border-gray-700">Amount (Rp)</th>
            <th className="p-2 border dark:border-gray-700">Status</th>
            <th className="p-2 border dark:border-gray-700">Payment Type</th>
            <th className="p-2 border dark:border-gray-700">Transaction Time</th>
          </tr>
        </thead>
        <tbody>
          {pagedOrders.map((o) => (
            <tr key={o.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td className="p-2 border dark:border-gray-700">{o.order_id}</td>
              <td className="p-2 border dark:border-gray-700">{o.user_id || "-"}</td>
              <td className="p-2 border dark:border-gray-700">{o.plan || "-"}</td>
              <td className="p-2 border dark:border-gray-700">Rp {formatIDR(o.amount)}</td>
              <td className="p-2 border dark:border-gray-700">{o.status}</td>
              <td className="p-2 border dark:border-gray-700">{o.payment_type || "-"}</td>
              <td className="p-2 border dark:border-gray-700">
                {o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-"}
              </td>
            </tr>
          ))}
          {pagedOrders.length === 0 && (
            <tr><td className="p-3 text-center" colSpan={7}>No orders</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PaginationControls({ page, totalPages, setPage }) {
  return (
    <div className="flex justify-center mt-4 gap-2">
      <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
    </div>
  );
}
