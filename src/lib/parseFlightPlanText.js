export function parseFlightPlanText(raw) {
  if (!raw) return [];

  let text = raw
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, ":")
    .replace(/O/g, "0")
    .replace(/I/g, "1");

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  console.log("🔍 OCR Lines:", lines);

  const entry = {
    date: "",
    aircraft: "",
    registration: "",
    flight_no: "",
    from: "",
    to: "",
    std: "",
    sta: "",
    block_off: "",
    block_on: "",
    takeoff: "",
    landing: "",
    block_mins: null,
    air_mins: null,
  };

  // Extract STD/STA
  const stdMatch = text.match(/STD:?(\d{2}[A-Z]{3}\s+\d{4}Z)/);
  if (stdMatch) entry.std = stdMatch[1];

  const staMatch = text.match(/STA:?(\d{4}Z)/);
  if (staMatch) entry.sta = staMatch[1];

  // Aircraft/Reg/Flight
  const acMatch = text.match(/\b(A[0-9]{3}|B[0-9]{3}|ATR[ -]?\d{2,3})\b/);
  if (acMatch) entry.aircraft = acMatch[1];

  const regMatch = text.match(/\b([A-Z]{2,3}-[A-Z0-9]{3,4})\b/);
  if (regMatch) entry.registration = regMatch[1];

  const fnMatch = text.match(/\b([A-Z]{2,3}\d{2,4})\b/);
  if (fnMatch) entry.flight_no = fnMatch[1];

  // DEP line
  const depLine = lines.find((l) => l.includes("DEP"));
  if (depLine) {
    const timeRegex = /(\d{2}:?\d{2})/g;
    const times = depLine.match(timeRegex) || [];
    entry.from = depLine.match(/DEP\s+([A-Z]{3,4})/)?.[1] || "";
    entry.block_off = fmtTime(times[0]);
    entry.takeoff = fmtTime(times[1]);
  }

  // ARR line
  const arrLine = lines.find((l) => l.includes("ARR"));
  if (arrLine) {
    const timeRegex = /(\d{2}:?\d{2})/g;
    const times = arrLine.match(timeRegex) || [];
    entry.to = arrLine.match(/ARR\s+([A-Z]{3,4})/)?.[1] || "";
    entry.block_on = fmtTime(times[0]);
    entry.landing = fmtTime(times[1]);
  }

  // BLOCK / AIR TIME line
  const blockLine = lines.find((l) => l.includes("BLOCK"));
  if (blockLine) {
    const timeRegex = /(\d{1,2}:?\d{2})/g;
    const times = blockLine.match(timeRegex) || [];
    entry.block_mins = toMins(times[0]);
    entry.air_mins = toMins(times[1]);
  } else {
    // fallback: hitung dari off/on & takeoff/landing
    if (entry.block_off && entry.block_on) {
      entry.block_mins = diffMins(entry.block_off, entry.block_on);
    }
    if (entry.takeoff && entry.landing) {
      entry.air_mins = diffMins(entry.takeoff, entry.landing);
    }
  }

  return entry.from && entry.to ? [entry] : [];
}

// Helpers
function fmtTime(t) {
  if (!t) return "";
  const clean = t.replace(".", ":");
  if (clean.includes(":")) {
    const [h, m] = clean.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }
  return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

function toMins(t) {
  if (!t) return null;
  const [h, m] = t.replace(".", ":").split(":").map(Number);
  return h * 60 + m;
}

function diffMins(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}
