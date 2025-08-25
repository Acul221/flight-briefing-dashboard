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
  addEntries: (newEntries) =>
    set((state) => ({
      entries: [...state.entries, ...newEntries],
    })),
  clear: () => set({ entries: [] }),

  exportCSV: () => {
    const rows = [
      [
        "Date",
        "AircraftType",
        "Registration",
        "FlightNo",
        "From",
        "To",
        "STD",
        "STA",
        "BlockOff",
        "Takeoff",
        "Landing",
        "BlockOn",
        "BlockTime",
        "AirTime",
        "Remarks",
        "Warnings", // ✅ Kolom baru
      ],
      ...get().entries.map((e) => [
        e.date || e.date_hint || "",
        e.aircraft || "",
        e.registration || "",
        e.flight_no || "",
        e.from || "",
        e.to || "",
        e.std || "",
        e.sta || "",
        e.block_off || "",
        e.takeoff || "",
        e.landing || "",
        e.block_on || "",
        toHHMM(e.block_mins),
        toHHMM(e.air_mins),
        e.remarks || "",
        e.confidence ? e.confidence.join("; ") : "", // ✅ isi warnings
      ]),
    ];

    const csv = rows
      .map((r) =>
        r.map((c) => `"${(c ?? "").toString().replace(/"/g, '""')}"`).join(",")
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
