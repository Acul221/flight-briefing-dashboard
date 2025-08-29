import airportsData from "../dictionary/airports.json";
import aircraftData from "../dictionary/aircraft.json";

const knownAirports = airportsData.airports;
const knownAircraft = aircraftData.aircraft;
const knownRegs = [/^PK-[A-Z0-9]{3,4}$/]; // bisa tambah pola lain kalau perlu

// --- Normalisasi karakter OCR ---
function normalizeChars(s) {
  if (!s) return "";
  const charMap = {
    O: "0", Q: "0",
    I: "1", L: "1",
    Z: "2",
    S: "5",
    R: "K" // OCR sering salah K jadi R
  };
  return s
    .split("")
    .map((ch) => charMap[ch] || ch)
    .join("");
}

// --- Clean time string ---
function cleanTime(t) {
  if (!t) return "";
  return normalizeChars(t)
    .replace(/\./g, ":")
    .replace(/[^0-9:]/g, "");
}

// --- Validasi jam (00:00–23:59) ---
function isValidTime(t) {
  if (!t || !t.includes(":")) return false;
  const [h, m] = t.split(":").map(Number);
  return (
    Number.isInteger(h) &&
    Number.isInteger(m) &&
    h >= 0 && h < 24 &&
    m >= 0 && m < 60
  );
}

// --- Cari baris dengan fuzzy keyword ---
function findLine(lines, keywords) {
  return lines.find((l) => keywords.some((kw) => l.includes(kw))) || "";
}

// --- Levenshtein distance ---
function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? m[i - 1][j - 1]
        : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

// --- Auto-correct Airport ---
function fixAirport(code) {
  if (!code) return "";
  const norm = normalizeChars(code.toUpperCase());
  if (knownAirports.includes(norm)) return norm;

  let best = norm, score = 99;
  for (const a of knownAirports) {
    const d = levenshtein(norm, a);
    if (d < score) { score = d; best = a; }
  }
  return score <= 1 ? best : norm;
}

// --- Auto-correct Aircraft ---
function fixAircraft(ac) {
  if (!ac) return "";
  const norm = normalizeChars(ac.toUpperCase().replace(/\s+/g, ""));
  if (knownAircraft.includes(norm)) return norm;

  let best = norm, score = 99;
  for (const a of knownAircraft) {
    const d = levenshtein(norm, a);
    if (d < score) { score = d; best = a; }
  }
  return score <= 1 ? best : norm;
}

// --- Auto-correct Registration ---
function fixRegistration(reg) {
  if (!reg) return "";
  const norm = normalizeChars(reg.toUpperCase());
  if (knownRegs.some((r) => r.test(norm))) return norm;
  return norm;
}

// --- Convert jam ke menit ---
function toMins(t) {
  if (!t) return null;
  const [h, m] = cleanTime(t).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

// --- Hitung selisih menit ---
function diffMins(start, end) {
  const [sh, sm] = cleanTime(start).split(":").map(Number);
  const [eh, em] = cleanTime(end).split(":").map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) return null;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

// --- Main Parser ---
export function parseFlightPlanText(raw) {
  if (!raw) return [];

  let text = normalizeChars(
    raw.toUpperCase().replace(/\s+/g, " ").replace(/\./g, ":")
  );

  const lines = raw
    .split("\n")
    .map((l) => normalizeChars(l.trim().toUpperCase()))
    .filter(Boolean);

  console.log("🔍 OCR Lines:", lines);

  const entry = {
    date: "",
    aircraft: "",
    registration: "",
    flight_no: "",
    std: "",
    sta: "",
    from: "",
    to: "",
    block_off: "",
    block_on: "",
    takeoff: "",
    landing: "",
    block_mins: null,
    air_mins: null,
    confidence: [],
  };

  // --- Metadata umum ---
  const dateMatch = text.match(/(\d{2}[A-Z]{3}|\d{2}[-/]\d{2}[-/]\d{2,4})/);
  if (dateMatch) entry.date = dateMatch[1];

  const acMatch = text.match(/\b(A[0-9]{3}|B[0-9]{3}|ATR[ -]?\d{2,3})\b/);
  if (acMatch) entry.aircraft = fixAircraft(acMatch[1]);

  const regMatch = text.match(/\b([A-Z]{2,3}-[A-Z0-9]{3,4})\b/);
  if (regMatch) entry.registration = fixRegistration(regMatch[1]);

  const fnMatch = text.match(/\b([A-Z]{2,3}\d{2,4})\b/);
  if (fnMatch) entry.flight_no = fnMatch[1];

  // STD/STA
  const stdMatch = text.match(/STD:?(\d{2}[A-Z]{3}\s+\d{4}Z)/);
  if (stdMatch) entry.std = stdMatch[1];
  const staMatch = text.match(/STA:?(\d{4}Z)/);
  if (staMatch) entry.sta = staMatch[1];

  // --- Cari baris inti ---
  const arrLine = findLine(lines, ["ARR", "BLK-ON", "LDNG"]);
  const depLine = findLine(lines, ["DEP", "BL-OFF", "TKOF"]);
  const blockLine = findLine(lines, ["BLOCK", "AIR TIME"]);

  console.log("🔎 Candidate ARR:", arrLine);
  console.log("🔎 Candidate DEP:", depLine);
  console.log("🔎 Candidate BLOCK:", blockLine);

  const timeRegex = /(\d{2}:?\d{2})/g;

  // DEP
  if (depLine) {
    const times = depLine.match(timeRegex) || [];
    entry.from = fixAirport(depLine.match(/DEP\s+([A-Z0-9]{3,4})/)?.[1] || "");
    entry.block_off = cleanTime(times[0]);
    entry.takeoff = cleanTime(times[1]);

    if (!isValidTime(entry.block_off)) entry.confidence.push("⚠️ Block Off time invalid");
    if (!isValidTime(entry.takeoff)) entry.confidence.push("⚠️ Takeoff time invalid");
  } else {
    entry.confidence.push("⚠️ DEP line not detected");
  }

  // ARR
  if (arrLine) {
    const times = arrLine.match(timeRegex) || [];
    entry.to = fixAirport(arrLine.match(/ARR\s+([A-Z0-9]{3,4})/)?.[1] || "");
    entry.block_on = cleanTime(times[0]);
    entry.landing = cleanTime(times[1]);

    if (!isValidTime(entry.block_on)) entry.confidence.push("⚠️ Block On time invalid");
    if (!isValidTime(entry.landing)) entry.confidence.push("⚠️ Landing time invalid");
  } else {
    entry.confidence.push("⚠️ ARR line not detected");
  }

  // BLOCK / AIR TIME
  if (blockLine) {
    const times = blockLine.match(timeRegex) || [];
    entry.block_mins = times[0] ? toMins(times[0]) : null;
    entry.air_mins = times[1] ? toMins(times[1]) : null;

    if (!entry.block_mins) entry.confidence.push("⚠️ Block time not detected");
    if (!entry.air_mins) entry.confidence.push("⚠️ Air time not detected");
  } else {
    if (entry.block_off && entry.block_on) entry.block_mins = diffMins(entry.block_off, entry.block_on);
    if (entry.takeoff && entry.landing) entry.air_mins = diffMins(entry.takeoff, entry.landing);
  }

  return entry.from && entry.to ? [entry] : [];
}
