// 🔧 Bersihkan jam dari noise OCR
function cleanTime(t) {
  if (!t) return "";
  return t
    .replace(/[OQ]/g, "0")   // O/Q → 0
    .replace(/I/g, "1")      // I → 1
    .replace(/\./g, ":")     // titik → colon
    .replace(/[^0-9:]/g, ""); // hapus karakter aneh
}

// 🔧 Cek apakah jam valid (00:00–23:59)
function isValidTime(t) {
  if (!t || !t.includes(":")) return false;
  const [h, m] = t.split(":").map(Number);
  return (
    Number.isInteger(h) &&
    Number.isInteger(m) &&
    h >= 0 &&
    h < 24 &&
    m >= 0 &&
    m < 60
  );
}

// 🔧 Cari baris dengan fuzzy keyword
function findLine(lines, keywords) {
  return (
    lines.find((l) =>
      keywords.some((kw) => l.includes(kw))
    ) || ""
  );
}

// 🔧 Convert jam ke menit
function toMins(t) {
  if (!t) return null;
  const [h, m] = cleanTime(t).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

// 🔧 Hitung selisih menit (dengan rollover midnight)
function diffMins(start, end) {
  const [sh, sm] = cleanTime(start).split(":").map(Number);
  const [eh, em] = cleanTime(end).split(":").map(Number);
  if (
    !Number.isFinite(sh) ||
    !Number.isFinite(sm) ||
    !Number.isFinite(eh) ||
    !Number.isFinite(em)
  )
    return null;

  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins;
}

// 🔧 Main parser
export function parseFlightPlanText(raw) {
  if (!raw) return [];

  // Normalisasi kasar
  let text = raw
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\./g, ":")
    .replace(/O/g, "0")
    .replace(/I/g, "1");

  const lines = raw
    .split("\n")
    .map((l) => l.trim().toUpperCase())
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

  // ✈️ Metadata umum
  const dateMatch = text.match(/(\d{2}[A-Z]{3}|\d{2}[-/]\d{2}[-/]\d{2,4})/);
  if (dateMatch) entry.date = dateMatch[1];

  const acMatch = text.match(/\b(A[0-9]{3}|B[0-9]{3}|ATR[ -]?\d{2,3})\b/);
  if (acMatch) entry.aircraft = acMatch[1];

  const regMatch = text.match(/\b([A-Z]{2,3}-[A-Z0-9]{3,4})\b/);
  if (regMatch) entry.registration = regMatch[1];

  const fnMatch = text.match(/\b([A-Z]{2,3}\d{2,4})\b/);
  if (fnMatch) entry.flight_no = fnMatch[1];

  // STD/STA
  const stdMatch = text.match(/STD:?(\d{2}[A-Z]{3}\s+\d{4}Z)/);
  if (stdMatch) entry.std = stdMatch[1];

  const staMatch = text.match(/STA:?(\d{4}Z)/);
  if (staMatch) entry.sta = staMatch[1];

  // ✈️ Cari baris inti
  const arrLine = findLine(lines, ["ARR", "BLK-ON", "LDNG"]);
  const depLine = findLine(lines, ["DEP", "BL-OFF", "TKOF"]);
  const blockLine = findLine(lines, ["BLOCK", "AIR TIME"]);

  console.log("🔎 Candidate ARR:", arrLine);
  console.log("🔎 Candidate DEP:", depLine);
  console.log("🔎 Candidate BLOCK:", blockLine);

  const timeRegex = /(\d{2}:?\d{2})/g;

  // DEP line
  if (depLine) {
    const times = depLine.match(timeRegex) || [];
    entry.from = depLine.match(/DEP\s+([A-Z]{3,4})/)?.[1] || "";
    entry.block_off = cleanTime(times[0]);
    entry.takeoff = cleanTime(times[1]);

    if (!isValidTime(entry.block_off))
      entry.confidence.push("⚠️ Block Off time invalid");
    if (!isValidTime(entry.takeoff))
      entry.confidence.push("⚠️ Takeoff time invalid");
  } else {
    entry.confidence.push("⚠️ DEP line not detected");
  }

  // ARR line
  if (arrLine) {
    const times = arrLine.match(timeRegex) || [];
    entry.to = arrLine.match(/ARR\s+([A-Z]{3,4})/)?.[1] || "";
    entry.block_on = cleanTime(times[0]);
    entry.landing = cleanTime(times[1]);

    if (!isValidTime(entry.block_on))
      entry.confidence.push("⚠️ Block On time invalid");
    if (!isValidTime(entry.landing))
      entry.confidence.push("⚠️ Landing time invalid");
  } else {
    entry.confidence.push("⚠️ ARR line not detected");
  }

  // BLOCK / AIR TIME line
  if (blockLine) {
    const times = blockLine.match(timeRegex) || [];
    entry.block_mins = toMins(times[0]);
    entry.air_mins = toMins(times[1]);

    if (!entry.block_mins)
      entry.confidence.push("⚠️ Block time not detected");
    if (!entry.air_mins)
      entry.confidence.push("⚠️ Air time not detected");
  } else {
    // fallback
    if (entry.block_off && entry.block_on) {
      entry.block_mins = diffMins(entry.block_off, entry.block_on);
    }
    if (entry.takeoff && entry.landing) {
      entry.air_mins = diffMins(entry.takeoff, entry.landing);
    }
  }

  // ✅ Only return if DEP & ARR exist
  return entry.from && entry.to ? [entry] : [];
}
