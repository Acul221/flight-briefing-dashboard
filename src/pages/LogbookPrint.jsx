// src/pages/LogbookPrint.jsx
import { useMemo } from "react";
import { useLogbookStore } from "../store/useLogbookStore";

const toHHMM = (mins) => {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h)}:${String(m).padStart(2, "0")}`;
};

export default function LogbookPrint() {
  const entries = useLogbookStore((s) => s.entries);

  const pageTotal = useMemo(
    () => entries.reduce((a, e) => a + (e.block_mins || 0), 0),
    [entries]
  );

  return (
    <div className="mx-auto bg-white p-6 text-[12px] leading-tight print:p-0">
      <style>{`@page{size:A4;margin:14mm} @media print{.noprint{display:none}}`}</style>

      <div className="flex justify-between mb-2">
        <div className="font-semibold">Pilot: (your name)</div>
        <div>Entries: {entries.length}</div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-12 font-semibold border-y">
        <div className="col-span-2 p-1">DATE</div>
        <div className="col-span-2 p-1">AIRCRAFT / IDENT</div>
        <div className="col-span-2 p-1">ROUTE OF FLIGHT</div>
        <div className="col-span-2 p-1 text-right">TOTAL DURATION</div>
        <div className="col-span-2 p-1 text-center">JET</div>
        <div className="col-span-2 p-1 text-center">LNDGS D/N</div>
      </div>

      {/* Rows */}
      {entries.map((e) => (
        <div key={e.id} className="grid grid-cols-12 border-b">
          <div className="col-span-2 p-1">{e.date || e.date_hint || ""}</div>
          <div className="col-span-2 p-1">
            {(e.aircraft || "A/C")} {(e.registration || "")}
          </div>
          <div className="col-span-2 p-1">
            {(e.from || "----")} → {(e.to || "----")}
          </div>
          <div className="col-span-2 p-1 text-right">
            {toHHMM(e.block_mins)}
          </div>
          <div className="col-span-2 p-1 text-center">
            {toHHMM(e.block_mins)}
          </div>
          <div className="col-span-2 p-1 text-center">{/* D/N opsional */}</div>
        </div>
      ))}

      {/* Totals */}
      <div className="flex justify-between mt-2 border-t pt-2">
        <div>Totals This Page</div>
        <div className="text-right">{toHHMM(pageTotal)}</div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          className="noprint px-4 py-2 rounded-xl bg-black text-white"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>
    </div>
  );
}
