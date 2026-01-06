// src/lib/parseLogbookText.js

/**
 * Parser OCR logbook toleran untuk data flight plan/OFPL printout.
 */
export function parseLogbookText(text) {
  if (!text) return [];

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const entries = lines.map((line) => {
    let norm = line.replace(/\s+/g, " ");
    norm = norm.replace(/O/g, "0"); // koreksi O→0

    /**
     * Format ditangkap:
     * - Date: dd[-/]mm[-/]yy(yy)? atau ddMMM
     * - From-To: ICAO/IATA 3–4 huruf
     * - Block off/on: hh:mm atau hhmm atau hh.mm
     * - Role: PIC/SIC optional
     * - Aircraft: A320/B737 dsb
     * - Air time: h:mm atau m:ss
     */
    const regex =
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}[A-Z]{3})\s+([A-Z]{3,4})[-/ ]([A-Z]{3,4})\s+(\d{2}[:.]?\d{2})[/ ](\d{2}[:.]?\d{2})\s*(PIC|SIC)?\s*([A-Z0-9]+)?\s*(\d+[:.]\d{2})?/;

    const m = norm.match(regex);
    if (!m) return null;

    const fmtTime = (t) => {
      if (!t) return null;
      const clean = t.replace(".", ":");
      return clean.includes(":")
        ? clean
        : `${clean.slice(0, 2)}:${clean.slice(2)}`;
    };

    return {
      date: m[1], // "26-07-2025" atau "26JUL"
      from: m[2],
      to: m[3],
      block_off: fmtTime(m[4]),
      block_on: fmtTime(m[5]),
      role: m[6] || "",
      aircraft: m[7] || "",
      air_time: m[8] ? fmtTime(m[8]) : "",
      block_mins: calcMins(fmtTime(m[4]), fmtTime(m[5])),
      air_mins: toMins(m[8]),
    };
  });

  return entries.filter(Boolean);
}

function toMins(hhmm) {
  if (!hhmm) return null;
  const t = hhmm.replace(".", ":");
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function calcMins(start, end) {
  if (!start || !end) return null;
  const s = start.replace(".", ":");
  const e = end.replace(".", ":");
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // rollover midnight
  return mins;
}
