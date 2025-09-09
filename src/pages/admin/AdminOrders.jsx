import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import {
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AdminOrdersPro() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch orders
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("transaction_time", { ascending: false })
      .limit(1000);

    if (error) console.error(error);
    else setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Realtime subscription
    const sub = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        fetchOrders();
        toast.success("🔔 New transaction update!");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  // Filter + Search + Date
  const filteredOrders = orders.filter((o) => {
    const matchStatus = filter === "all" || o.status === filter;
    const matchPayment = paymentFilter === "all" || o.payment_type === paymentFilter;
    const matchPlan = planFilter === "all" || o.plan === planFilter;
    const matchSearch =
      search === "" || o.order_id.toLowerCase().includes(search.toLowerCase());

    const txDate = o.transaction_time ? new Date(o.transaction_time) : null;
    const matchFrom = dateFrom ? txDate >= new Date(dateFrom) : true;
    const matchTo = dateTo ? txDate <= new Date(new Date(dateTo).setHours(23, 59, 59)) : true;

    return matchStatus && matchPayment && matchPlan && matchSearch && matchFrom && matchTo;
  });

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  // Stats
  const total = filteredOrders.length;
  const successCount = filteredOrders.filter((o) => o.status === "success").length;
  const pendingCount = filteredOrders.filter((o) => o.status === "pending").length;
  const failedCount = filteredOrders.filter(
    (o) => o.status === "failed" || o.status === "expire"
  ).length;
  const revenue = filteredOrders
    .filter((o) => o.status === "success")
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  // CSV Export
  const exportCSV = () => {
    const header = ["Order ID", "Plan", "Amount", "Status", "Payment Type", "Transaction Time"];
    const rows = filteredOrders.map((o) => [
      o.order_id,
      o.plan || "-",
      o.amount,
      o.status,
      o.payment_type || "-",
      o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-",
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    toast.success("✅ Exported to CSV");
  };

  // PDF Export
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Orders Report – SkyDeckPro", 14, 20);

    const tableColumn = ["Order ID", "Plan", "Amount", "Status", "Payment Type", "Transaction Time"];
    const tableRows = filteredOrders.map((o) => [
      o.order_id,
      o.plan || "-",
      `Rp ${o.amount?.toLocaleString("id-ID")}`,
      o.status,
      o.payment_type || "-",
      o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Generated on ${new Date().toLocaleString("id-ID")}`,
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save("orders.pdf");
    toast.success("📄 Exported to PDF");
  };

  // Excel Export
  const exportExcel = () => {
    const data = filteredOrders.map((o) => ({
      "Order ID": o.order_id,
      Plan: o.plan || "-",
      Amount: o.amount,
      Status: o.status,
      "Payment Type": o.payment_type || "-",
      "Transaction Time": o.transaction_time
        ? new Date(o.transaction_time).toLocaleString("id-ID")
        : "-",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders.xlsx");
    toast.success("📊 Exported to Excel");
  };

  // Colors for charts
  const COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa"];

  return (
    <div className="max-w-7xl mx-auto p-6 dark:bg-gray-900 dark:text-gray-100 min-h-screen transition-colors">
      <h1 className="text-3xl font-bold mb-6">📊 Orders Dashboard (Pro)</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Orders" value={total} color="blue" />
        <StatCard title="Success" value={successCount} color="green" />
        <StatCard title="Pending" value={pendingCount} color="yellow" />
        <StatCard title="Failed / Expired" value={failedCount} color="red" />
      </div>

      {/* Revenue */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/40 rounded-xl shadow mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
        <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
          Rp {revenue.toLocaleString("id-ID")}
        </p>
      </div>

      {/* Filters */}
      <Filters
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        planFilter={planFilter}
        setPlanFilter={setPlanFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        exportCSV={exportCSV}
        exportPDF={exportPDF}
        exportExcel={exportExcel}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={filteredOrders.map((o) => ({
              date: new Date(o.transaction_time).toLocaleDateString("id-ID"),
              amount: o.amount,
            }))}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#4ade80" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Payment Types</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={Object.entries(
                  filteredOrders.reduce((acc, o) => {
                    acc[o.payment_type || "Unknown"] =
                      (acc[o.payment_type || "Unknown"] || 0) + 1;
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

      {/* Table */}
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

// --- Components ---
function StatCard({ title, value, color }) {
  const colorMap = {
    blue: "text-blue-600 dark:text-blue-300",
    green: "text-green-600 dark:text-green-300",
    yellow: "text-yellow-600 dark:text-yellow-300",
    red: "text-red-600 dark:text-red-300",
  };
  return (
    <div className={`p-4 bg-${color}-50 dark:bg-${color}-900/40 rounded-xl shadow`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
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
      <input type="text" placeholder="Search Order ID..." className="flex-1 border rounded px-3 py-2 dark:bg-gray-800" value={search} onChange={(e) => setSearch(e.target.value)} />
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
      <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg shadow">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800 text-left">
            <th className="p-2 border dark:border-gray-700">Order ID</th>
            <th className="p-2 border dark:border-gray-700">Plan</th>
            <th className="p-2 border dark:border-gray-700">Amount (Rp)</th>
            <th className="p-2 border dark:border-gray-700">Status</th>
            <th className="p-2 border dark:border-gray-700">Payment Type</th>
            <th className="p-2 border dark:border-gray-700">Transaction Time</th>
          </tr>
        </thead>
        <tbody>
          {pagedOrders.map((o) => (
            <tr key={o.order_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="p-2 border dark:border-gray-700">{o.order_id}</td>
              <td className="p-2 border dark:border-gray-700">{o.plan || "-"}</td>
              <td className="p-2 border dark:border-gray-700">Rp {o.amount?.toLocaleString("id-ID")}</td>
              <td className="p-2 border dark:border-gray-700">{o.status}</td>
              <td className="p-2 border dark:border-gray-700">{o.payment_type || "-"}</td>
              <td className="p-2 border dark:border-gray-700">
                {o.transaction_time ? new Date(o.transaction_time).toLocaleString("id-ID") : "-"}
              </td>
            </tr>
          ))}
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
