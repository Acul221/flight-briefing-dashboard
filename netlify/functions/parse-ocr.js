// netlify/functions/parse-ocr.js
const hhmm = (s) => s ? s.replace(".",":").trim().padStart(5,"0") : "";
const toMins = (s) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s||"");
  return m ? (+m[1])*60 + (+m[2]) : null;
};
const wrap = (a,b) => (a==null||b==null) ? null : (b - a + 1440) % 1440;
const pick = (T, re, i=1) => (T.match(re)||[])[i] || "";

exports.handler = async (event) => {
  if (event.httpMethod === "GET") {
    return { statusCode: 200, body: JSON.stringify({ ok: true, name: "parse-ocr" }) };
  }
  try {
    const { rawText = "" } = JSON.parse(event.body || "{}");
    const T = rawText.toUpperCase();

    const out = {};
    out.date_hint  = pick(T, /\bSTD[:\s]*([0-3]?\d[A-Z]{3})\b/) || pick(T, /\b([0-3]?\d[A-Z]{3})\b/);
    out.aircraft   = pick(T, /\b(A\d{3}(?:-\d{3})?)\b/);
    out.registration = pick(T, /\b([A-Z]{2}-[A-Z0-9]{3,4})\b/);
    out.flight_no  = pick(T, /\b([A-Z]{2,4}\d{2,4})\b/);

    // DEP/ARR muncul sebagai "DEP WIII/CGK" dan "ARR WADD/DPS"
    out.from = pick(T, /\bDEP[^A-Z0-9]{0,10}([A-Z]{4})\b/) || (T.match(/\b([A-Z]{4})\/[A-Z]{3,4}\b/)?.[1] || "");
    out.to   = pick(T, /\bARR[^A-Z0-9]{0,10}([A-Z]{4})\b/) || (T.match(/\b([A-Z]{4})\/[A-Z]{3,4}\b/g)?.slice(-1)[0]?.match(/[A-Z]{4}/)?.[0] || "");

    out.bo   = hhmm(pick(T, /\b(?:BLK[\s-]?OFF|BLOCK[\s-]?OFF|BO)[:\s]*([0-2]?\d[:\.][0-5]\d)\b/, 1));
    out.bn   = hhmm(pick(T, /\b(?:BLK[\s-]?ON|BLOCK[\s-]?ON|BN)[:\s]*([0-2]?\d[:\.][0-5]\d)\b/, 1));
    out.toff = hhmm(pick(T, /\b(?:TKO?F|T[\/ ]?O|TAKE\s*OFF)[:\s]*([0-2]?\d[:\.][0-5]\d)\b/, 1));
    out.ldg  = hhmm(pick(T, /\b(?:LDNG|LDG|LAND(?:ING)?)[:\s]*([0-2]?\d[:\.][0-5]\d)\b/, 1));

    // alternatif eksplisit: "BLOCK 01:53" & "AIR TIME 01:31"
    const block_hhmm = hhmm(pick(T, /\bBLOCK[:\s]*([0-2]?\d[:\.][0-5]\d)\b/, 1));
    const air_hhmm   = hhmm(pick(T, /\bAIR\s*TIME[:\s]*([0-2]?\d[:\.][0-5]\d)\b/, 1));
    if (block_hhmm) out.block_hhmm = block_hhmm;
    if (air_hhmm) out.air_hhmm = air_hhmm;

    const block_mins = block_hhmm ? toMins(block_hhmm) : wrap(toMins(out.bo), toMins(out.bn));
    const air_mins   = air_hhmm ? toMins(air_hhmm)     : wrap(toMins(out.toff), toMins(out.ldg));
    if (block_mins != null) out.block_mins = block_mins;
    if (air_mins != null) out.air_mins = air_mins;

    // debug supaya kamu tahu OCR-nya sudah terbaca
    out.debug_sample = T.slice(0, 400);
    out.ocr_len = T.length;

    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message || "bad request" }) };
  }
};
