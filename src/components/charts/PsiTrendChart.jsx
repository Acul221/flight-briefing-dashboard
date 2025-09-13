import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { usePsiTrend } from "@/hooks/usePsiTrend";

export default function PsiTrendChart() {
  const { trend, loading } = usePsiTrend();

  if (loading) return <p className="text-gray-400">Loading trend...</p>;
  if (!trend.length) return <p className="text-gray-400">No data available</p>;

  return (
    <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4">
      <h2 className="text-lg font-semibold mb-4">Core Web Vitals Trend (7 Hari)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trend}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="avg_lcp" stroke="#8884d8" name="Avg LCP (ms)" />
          <Line type="monotone" dataKey="avg_inp" stroke="#82ca9d" name="Avg INP (ms)" />
          <Line type="monotone" dataKey="avg_cls" stroke="#ff7300" name="Avg CLS" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
