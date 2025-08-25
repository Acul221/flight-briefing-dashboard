// netlify/functions/parse-ocr.js

export async function handler(event) {
  try {
    const body = JSON.parse(event.body || "{}");
    let raw = (body.rawText || "");

    // ------- Normalisasi kuat -------
    const N = (s) => (s || "")
      .replace(/\r/g, "")
      .replace(/[|]/g, "I")
      .replace(/[“”„]/g, '"')
      .replace(/[’`´]/g, "'");

    // Untuk jam (koreksi karakter yang sering salah)
    const normTime = (s) => (s || "")
      .toUpperCase()
      .replace(/O/g, "0").replace(/I/g, "1").replace(/B/g, "8")
      .replace(/[^0-9:.]/g, "")
      .replace(/\./g, ":");

    // Untuk REG/FLT
    const normIdent = (s) => (s || "")
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .replace(/5/g, "S")  // 5 ↔ S
      .replace(/0/g, "O"); // 0 ↔ O

    const clean = N(raw).toUpperCase().replace(/\s+/g, " ");

    const pick = (re) => {
      const m = clean.match(re);
      return m ? m[1].trim() : "";
    };

    // ------- Ambil field utama -------
    const aircraft     = normIdent(pick(/(A320-\s?\d{3}[A-Z]?)/));
    const registration = normIdent(pick(/\/\s*(PK-[A-Z0-9]+)/));
    const flight_no    = normIdent(pick(/(SJV\s?\d{3,4})/)).replace(/\s+/g, "");
    const date_hint    = pick(/STD:([0-9]{1,2}[A-Z]{3})/);

    const from = pick(/DEP\s+([A-Z]{4})/);
    const to   = pick(/ARR\s+([A-Z]{4})/);

    const bo   = normTime(pick(/BLK-?OFF\s+([0-2]?\d[:.][0-5]\d)/));
    const toff = normTime(pick(/TKOF\s+([0-2]?\d[:.][0-5]\d)/));
    const ldg  = normTime(pick(/LDN?G\s+([0-2]?\d[:.][0-5]\d)/)); // LDG / LDNG
    const bn   = normTime(pick(/BLK-?ON\s+([0-2]?\d[:.][0-5]\d)/));

    const block_hhmm = normTime(pick(/BLOCK\s+([0-2]?\d[:.][0-5]\d)/));
    const air_hhmm   = normTime(pick(/AIR\s*TIME\s+([0-2]?\d[:.][0-5]\d)/));

    const toMins = (s) => {
      if (!s || !s.includes(":")) return null;
      const [h, m] = s.split(":").map((n) => (+n || 0));
      return h * 60 + m;
    };

    const data = {
      date_hint,
      aircraft,
      registration,
      flight_no,
      from,
      to,
      bo, toff, ldg, bn,
      block_hhmm, air_hhmm,
      block_mins: toMins(block_hhmm),
      air_mins:   toMins(air_hhmm),
      debug_sample: raw.slice(0, 800)
    };

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error("parse-ocr error", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
