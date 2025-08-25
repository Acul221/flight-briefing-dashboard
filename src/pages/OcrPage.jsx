// src/pages/OcrPage.jsx
import OcrUploader from "../components/ocr/OcrUploader";
import { useLogbookStore } from "../store/useLogbookStore";

const toHHMM = (mins) => {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h)}:${String(m).padStart(2, "0")}`;
};

export default function OcrPage() {
  const entries = useLogbookStore((s) => s.entries);
  const exportCSV = useLogbookStore((s) => s.exportCSV);
  const clear = useLogbookStore((s) => s.clear);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">OCR Logbook (MVP)</h1>
      <OcrUploader />

      <div className="flex gap-2 mt-4">
        <button onClick={exportCSV} className="px-3 py-2 rounded bg-gray-900 text-white">
          Export CSV
        </button>
        <a href="/print" className="px-3 py-2 rounded bg-gray-200">Open Print View</a>
        <button onClick={clear} className="px-3 py-2 rounded bg-red-100 text-red-700">
          Clear All
        </button>
      </div>

      <div className="mt-4 border-t pt-3">
        <h2 className="font-medium mb-2">Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-1">Date</th>
                <th className="p-1">A/C</th>
                <th className="p-1">Reg</th>
                <th className="p-1">From</th>
                <th className="p-1">To</th>
                <th className="p-1 text-right">Block</th>
                <th className="p-1 text-right">Air</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b">
                  <td className="p-1">{e.date || e.date_hint || ""}</td>
                  <td className="p-1">{e.aircraft || ""}</td>
                  <td className="p-1">{e.registration || ""}</td>
                  <td className="p-1">{e.from || ""}</td>
                  <td className="p-1">{e.to || ""}</td>
                  <td className="p-1 text-right">{toHHMM(e.block_mins)}</td>
                  <td className="p-1 text-right">{toHHMM(e.air_mins)}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-500" colSpan={7}>
                    Belum ada entri. Upload foto untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
