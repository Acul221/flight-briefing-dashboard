import { useEffect, useState } from "react";
import OcrUploader from "../components/ocr/OcrUploader";
import { useLogbookStore } from "../store/useLogbookStore";
import { warmup } from "../lib/tessCdnWorker";
import { parseFlightPlanText } from "../lib/parseFlightPlanText";

const toHHMM = (mins) => {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h)}:${String(m).padStart(2, "0")}`;
};

export default function OcrPage() {
  const [pendingEntry, setPendingEntry] = useState(null);

  useEffect(() => {
    warmup().then(() => console.log("Tesseract warm-up done ✅"));
  }, []);

  const entries = useLogbookStore((s) => s.entries);
  const exportCSV = useLogbookStore((s) => s.exportCSV);
  const clear = useLogbookStore((s) => s.clear);

  const handleFileSelected = (file, rawText) => {
    const parsed = parseFlightPlanText(rawText);
    if (parsed.length > 0) {
      setPendingEntry(parsed[0]); // Preview dulu
    } else {
      console.warn("⚠️ Tidak ada entri valid dari OCR → cek RAW OCR TEXT");
    }
  };

  const saveEntry = () => {
    if (!pendingEntry) return;
    const withId = { id: `${Date.now()}`, ...pendingEntry };
    useLogbookStore.getState().addEntries([withId]);
    setPendingEntry(null);
    console.log("✅ Entry saved:", withId);
  };

  // Hitung total jam kumulatif
  const totalBlock = entries.reduce((acc, e) => acc + (e.block_mins || 0), 0);
  const totalAir = entries.reduce((acc, e) => acc + (e.air_mins || 0), 0);

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-3">OCR Flight Plan → Logbook</h1>

      <OcrUploader onFileSelected={handleFileSelected} />

      {/* Preview sebelum save */}
      {pendingEntry && (
        <div className="mt-4 p-3 rounded-lg border bg-gray-50">
          <h2 className="font-medium mb-2">Preview Entry</h2>
          {[
            ["date", "Date"],
            ["aircraft", "Aircraft"],
            ["registration", "Registration"],
            ["flight_no", "Flight No"],
            ["from", "From"],
            ["to", "To"],
            ["block_off", "Block Off"],
            ["takeoff", "Takeoff"],
            ["landing", "Landing"],
            ["block_on", "Block On"],
          ].map(([k, label]) => (
            <div key={k} className="flex items-center gap-2 mb-2">
              <label className="w-32 text-sm">{label}</label>
              <input
                className="flex-1 border rounded p-2 text-sm"
                value={pendingEntry[k] || ""}
                onChange={(e) =>
                  setPendingEntry((d) => ({ ...d, [k]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button
              onClick={saveEntry}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Save Entry
            </button>
            <button
              onClick={() => setPendingEntry(null)}
              className="px-4 py-2 bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Entries table */}
      <div className="mt-6 border-t pt-3">
        <h2 className="font-medium mb-2">Entries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-1">Date</th>
                <th className="p-1">Flight</th>
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
                  <td className="p-1">{e.date || ""}</td>
                  <td className="p-1">{e.flight_no || ""}</td>
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
                  <td className="p-3 text-gray-500" colSpan={8}>
                    Belum ada entri. Upload flight plan untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
            {entries.length > 0 && (
              <tfoot>
                <tr className="font-semibold border-t">
                  <td colSpan={6} className="p-1 text-right">
                    Total:
                  </td>
                  <td className="p-1 text-right">{toHHMM(totalBlock)}</td>
                  <td className="p-1 text-right">{toHHMM(totalAir)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={exportCSV}
            className="px-3 py-2 rounded bg-gray-900 text-white"
          >
            Export CSV
          </button>
          <a href="/print" className="px-3 py-2 rounded bg-gray-200">
            Open Print View
          </a>
          <button
            onClick={clear}
            className="px-3 py-2 rounded bg-red-100 text-red-700"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
