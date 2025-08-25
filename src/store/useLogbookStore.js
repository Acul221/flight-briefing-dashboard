// src/store/useLogbookStore.js
import { create } from "zustand";

const toHHMM = (mins) => {
  if (mins == null) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h)}:${String(m).padStart(2, "0")}`;
};

export const useLogbookStore = create((set, get) => ({
  entries: [],

  // Tambah satu entri manual
  addEntry: (e) => set((s) => ({ entries: [e, ...s.entries] })),

  // Tambah multiple entri (hasil OCR parser)
  addEntries: (newEntries) =>
    set((state) => ({
      entries: [...newEntries, ...state.entries],
    })),

  // Hapus semua entri
  clear: () => set({ entries: [] }),

  // Export ke CSV
  exportCSV: () => {
    const rows = [
      [
        "Date",
        "AircraftType",
        "Registration",
        "From",
        "To",
        "BlockOff",
        "Takeoff",
        "Landing",
        "BlockOn",
        "BlockTime",
        "AirTime",
        "Remarks",
      ],
      ...get().entries.map((e) => [
        e.date || e.date_hint || "",
        e.aircraft || "",
        e.registration || "",
        e.from || "",
        e.to || "",
        e.bo || "",
        e.toff || "",
        e.ldg || "",
        e.bn || "",
        toHHMM(e.block_mins),
        toHHMM(e.air_mins),
        e.remarks || "",
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((c) =>
            `"${(c ?? "").toString().replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logbook.csv";
    a.click();
    URL.revokeObjectURL(url);
  },
}));
