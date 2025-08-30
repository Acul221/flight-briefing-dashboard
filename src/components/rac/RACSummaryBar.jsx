import { diffMinutes } from "@/lib/timeMath";

const pillClass = (d, thr) => {
  if (d == null) return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200";
  const abs = Math.abs(d);
  if (abs <= thr.green) return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300";
  if (abs <= thr.yellow) return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300";
  return "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300";
};

export default function RACSummaryBar({ items, thresholds }) {
  return (
    <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700">
      {items.map(({ code, deviation }) => (
        <span key={code} className={`px-2 py-1 rounded-lg text-sm ${pillClass(deviation, thresholds)}`}>
          {code}: {deviation == null ? "—" : `${deviation>0?"+":""}${deviation}m`}
        </span>
      ))}
    </div>
  );
}
